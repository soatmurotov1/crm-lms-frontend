import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const surfaces = new Set(['Card', 'StatCard', 'DataCard']);
const controls = new Set([
  'button',
  'input',
  'select',
  'textarea',
  'option',
  'Button',
  'Input',
  'SelectTrigger',
  'Checkbox',
  'RadioGroupItem',
  'Switch',
  'Toggle',
  'ToggleGroupItem',
  'Badge',
  'Avatar',
  'AvatarFallback',
  'Skeleton',
  'Progress',
  'Slider',
  'PaginationLink',
  'DropdownMenuTrigger',
  'DialogTrigger',
  'PopoverTrigger',
  'CollapsibleTrigger',
  'TooltipTrigger',
  'SheetTrigger',
]);
const overlays = new Set([
  'DialogContent',
  'AlertDialogContent',
  'SheetContent',
  'DrawerContent',
  'PopoverContent',
  'HoverCardContent',
  'TooltipContent',
  'DropdownMenuContent',
  'DropdownMenuSubContent',
  'ContextMenuContent',
  'ContextMenuSubContent',
  'SelectContent',
  'Toast',
  'TourPopover',
  'ToastAction',
]);
const maps = new Set([
  'MapContainer',
  'TileLayer',
  'Marker',
  'Popup',
  'Tooltip',
  'CircleMarker',
]);
const leafClass = (token) =>
  token
    .split(/:(?![^\[]*\])/)
    .at(-1)
    .replace(/^!|!$/g, '');

/** Inspect JSX classes through the TypeScript AST, including cn and local constants. */
export function detectViolations(source, file) {
  if (file.endsWith('.css')) {
    return [...source.matchAll(/\.(glass(?:-[\w-]+)?)(?=[\s,{.:])/g)].map(
      (match) => ({
        file,
        line: source.slice(0, match.index).split('\n').length,
        rule: 'glass',
      }),
    );
  }
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const bindings = [];
  const lexicalScope = (node) => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (
        ts.isBlock(parent) ||
        ts.isSourceFile(parent) ||
        ts.isFunctionLike(parent)
      )
        return parent;
    }
    return ast;
  };
  function bind(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    )
      bindings.push({
        name: node.name.text,
        scope: lexicalScope(node),
        value: node.initializer,
      });
    if (ts.isFunctionDeclaration(node) && node.name)
      bindings.push({
        name: node.name.text,
        scope: lexicalScope(node),
        value: node,
      });
    ts.forEachChild(node, bind);
  }
  bind(ast);
  const resolve = (node) => {
    for (let scope = node; scope; scope = scope.parent) {
      const binding = bindings.find(
        (binding) => binding.name === node.text && binding.scope === scope,
      );
      if (binding) return binding.value;
    }
  };
  const product = (left, right, separator = ' ') =>
    left.flatMap((a) => right.map((b) => `${a}${separator}${b}`));
  function values(node, seen = new Set()) {
    if (!node || seen.has(node)) return [''];
    const next = new Set([...seen, node]);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return [node.text];
    if (ts.isTemplateExpression(node)) {
      let result = [node.head.text];
      for (const span of node.templateSpans)
        result = product(result, values(span.expression, next), '').map(
          (value) => value + span.literal.text,
        );
      return result;
    }
    if (ts.isIdentifier(node)) return values(resolve(node), next);
    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const binding = ts.isIdentifier(node.expression)
        ? resolve(node.expression)
        : node.expression;
      const key = ts.isPropertyAccessExpression(node)
        ? node.name.text
        : node.argumentExpression && values(node.argumentExpression, next)[0];
      if (binding && ts.isObjectLiteralExpression(binding)) {
        const property = binding.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) &&
            property.name.getText(ast).replace(/['"]/g, '') === key,
        );
        if (property) return values(property.initializer, next);
      }
      return [''];
    }
    if (ts.isObjectLiteralExpression(node))
      return node.properties.reduce(
        (result, property) =>
          ts.isPropertyAssignment(property)
            ? product(result, ['', ...values(property.name, next)])
            : result,
        [''],
      );
    if (ts.isCallExpression(node))
      return node.arguments.reduce(
        (result, argument) => product(result, values(argument, next)),
        [''],
      );
    if (ts.isConditionalExpression(node))
      return [...values(node.whenTrue, next), ...values(node.whenFalse, next)];
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
        return ['', ...values(node.right, next)];
      if (
        node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
        node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
      )
        return [...values(node.left, next), ...values(node.right, next)];
      if (node.operatorToken.kind === ts.SyntaxKind.PlusToken)
        return product(values(node.left, next), values(node.right, next), '');
      return [''];
    }
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isJsxExpression(node) ||
      ts.isAsExpression(node)
    )
      return values(node.expression, next);
    if (ts.isArrayLiteralExpression(node))
      return node.elements.reduce(
        (result, element) => product(result, values(element, next)),
        [''],
      );
    return [''];
  }
  const violations = [];
  function visit(node, ancestors = [], slottedControl = false) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const fullTag = opening.tagName.getText(ast);
      const tag = fullTag.split('.').at(-1);
      const attrs = opening.attributes.properties.filter(ts.isJsxAttribute);
      const attr = attrs.find((a) => a.name.getText(ast) === 'className');
      const combinations = values(attr?.initializer).map((value) =>
        value.split(/\s+/).filter(Boolean).map(leafClass),
      );
      const has = (expression) =>
        combinations.some((tokens) =>
          tokens.some((token) => expression.test(token)),
        );
      const hasSurface = combinations.some((tokens) =>
        [
          /^bg-card(?:\/|$)/,
          /^border(?:$|-(?:[01248]|border)(?:\/|$))/,
          /^rounded(?:-|$)/,
        ].every((expression) => tokens.some((token) => expression.test(token))),
      );
      const explicitNegative =
        file === 'src/features/design-system/DesignSystemBoard.tsx' &&
        attrs.some(
          (a) =>
            a.name.getText(ast) === 'data-design-example' &&
            a.initializer?.getText(ast) === '"negative"',
        );
      const swatch = attrs.some(
        (a) => a.name.getText(ast) === 'data-token-swatch',
      );
      const overlayPrimitive =
        /^(?:AlertDialog|Dialog|DropdownMenu|ContextMenu|Select|HoverCard|Popover|Tooltip|NavigationMenu|Menubar)Primitives?\.(?:Content|SubContent|Viewport)$/.test(
          fullTag,
        );
      const nativePrimitive =
        /^(?:Checkbox|RadioGroup|Slider|Switch|Tabs)Primitives?\.(?:Root|Thumb|Trigger|Track|Range|Item)$/.test(
          fullTag,
        );
      const add = (rule) =>
        violations.push({
          file,
          line:
            ast.getLineAndCharacterOfPosition(opening.getStart(ast)).line + 1,
          rule,
        });
      if (!explicitNegative) {
        if (has(/^glass(?:-|$)/)) add('glass');
        const ownSurface =
          file === 'src/components/ui/card.tsx' && tag === 'Component';
        const positionedPopover =
          has(/^bg-popover(?:\/|$)/) && has(/^(?:absolute|fixed)$/);
        const tourOverlay =
          file === 'src/components/tour/OwnerCrmTour.tsx' &&
          opening.attributes.properties.some(
            (a) =>
              ts.isJsxSpreadAttribute(a) &&
              a.expression.getText(ast) === 'tooltipProps',
          );
        const chartOverlay =
          file === 'src/components/ui/chart.tsx' &&
          has(/^bg-background$/) &&
          has(/^shadow-xl$/);
        const toastControl = /^ToastPrimitives?\.(?:Action|Close)$/.test(
          fullTag,
        );
        const navigationIndicator =
          fullTag === 'NavigationMenuPrimitive.Indicator';
        const mapOverlay =
          file === 'src/features/vehicles/pages/FleetMapPage.tsx' &&
          attrs.some((a) => a.name.getText(ast) === 'data-map-overlay');
        const exempt =
          chartOverlay ||
          toastControl ||
          navigationIndicator ||
          mapOverlay ||
          tourOverlay ||
          controls.has(tag) ||
          overlays.has(tag) ||
          maps.has(tag) ||
          swatch ||
          nativePrimitive ||
          overlayPrimitive ||
          ownSurface ||
          positionedPopover ||
          slottedControl ||
          (tag === 'Link' &&
            has(/^items-center$/) &&
            has(/^px-[23]$/) &&
            has(/^py-[12](?:\.5)?$/) &&
            !has(/^flex-col$/));
        if (!exempt) {
          if (!surfaces.has(tag) && hasSurface) add('raw-surface');
          if (
            !ancestors.some(
              (ancestor) =>
                overlays.has(ancestor) ||
                ancestor === 'Tooltip' ||
                ancestor === 'ChartTooltip',
            ) &&
            has(/^(?:shadow(?:$|-(?!none$))|drop-shadow(?:$|-(?!none$)))/)
          )
            add('shadow');
          if (has(/^rounded-(?:[2-9]xl|\[(?:[2-9]\d|1[3-9])px\])$/) ||
            (has(/^rounded-xl$/) &&
              has(/^(?:border(?:$|-)|bg-)/) &&
              !has(/^bg-popover(?:\/|$)/)))
            add('radius');
          if (
            has(
              /^border-(?:primary|secondary|accent|destructive|success|warning|info|(?:red|blue|amber|slate|gray|orange|green|violet|indigo|cyan|rose)-\d+)(?:\/|$)/,
            )
          )
            add('tinted-border');
          if (surfaces.has(tag) && ancestors.some((a) => surfaces.has(a)))
            add('nested-card');
          if (
            surfaces.has(tag) &&
            has(/^rounded(?:$|-(?!lg$|\[8px\]$|\[0\.5rem\]$).+)/)
          )
            add('surface-radius');
          if (
            surfaces.has(tag) &&
            combinations.some((tokens) =>
              tokens.some((token) => {
                const spacing = token.match(
                  /^p(?:x|y|t|r|b|l|s|e)?-(.+)$/,
                )?.[1];
                if (!spacing) return false;
                if (/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(spacing))
                  return ![0, 3, 4].includes(Number(spacing));
                if (spacing.startsWith('[')) {
                  const arbitrary = spacing.match(
                    /^\[(\d+(?:\.\d+)?|\.\d+)(px|rem)?\]$/,
                  );
                  if (!arbitrary) return true;
                  const value = Number(arbitrary[1]);
                  if (value === 0) return false;
                  return arbitrary[2] === 'px'
                    ? ![12, 16].includes(value)
                    : arbitrary[2] === 'rem'
                      ? ![0.75, 1].includes(value)
                      : true;
                }
                return false;
              }),
            )
          )
            add('surface-padding');
        }
      }
      const next =
        explicitNegative || overlays.has(tag) || overlayPrimitive
          ? []
          : [...ancestors, tag];
      const isControlSlot =
        (controls.has(tag) || nativePrimitive) &&
        attrs.some((a) => a.name.getText(ast) === 'asChild');
      if (ts.isJsxElement(node))
        node.children.forEach((child) => visit(child, next, isControlSlot));
      // Class expressions can contain render functions or conditional JSX.
      opening.attributes.properties.forEach((property) =>
        visit(property, next),
      );
      return;
    }
    ts.forEachChild(node, (child) => visit(child, ancestors, slottedControl));
  }
  visit(ast);
  // Include class definitions in cva variants, status maps and helper returns,
  // which may reach JSX through imported helpers or iteration parameters.
  const paletteEligible =
    file.startsWith('src/') &&
    file.endsWith('.tsx') &&
    !/\.(?:test|spec|stories)\.tsx$/.test(file) &&
    !/(?:^|\/)(?:__tests__|__stories__|tests|stories)\//.test(file) &&
    file !== 'src/features/design-system/DesignSystemBoard.tsx';
  if (paletteEligible) {
    const palette =
      /\b(?:bg|text|border|ring(?:-offset)?|from|to|via|fill|stroke|decoration|outline|divide)-(?:emerald|green|amber|orange|teal|yellow|red|rose|sky|blue|cyan|indigo|violet|purple|pink|lime|fuchsia|slate|gray|zinc|neutral|stone)-\d{2,3}\b/;
    const literal =
      /(?:\b(?:bg|text|border|ring(?:-offset)?|from|to|via|fill|stroke|decoration|outline|divide)-\[|\[(?:color|background(?:-color)?|border(?:-color)?|fill|stroke):)[^\]]*(?:#[\da-f]{3,8}\b|(?:hsl|rgb)a?\(\s*[-\d.])[^\]]*\]/i;
    const inspected = new Set();
    const matchedClasses = new Set();
    // Follow class expressions into local constants, cva variants and helper
    // returns. Property names also link iteration parameters to status maps.
    function inspectClasses(node) {
      if (!node || inspected.has(node)) return;
      inspected.add(node);
      if (ts.isConditionalExpression(node)) {
        inspectClasses(node.whenTrue);
        inspectClasses(node.whenFalse);
        return;
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind !== ts.SyntaxKind.PlusToken) {
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
          inspectClasses(node.right);
        else if (
          [
            ts.SyntaxKind.BarBarToken,
            ts.SyntaxKind.QuestionQuestionToken,
            ts.SyntaxKind.PlusToken,
          ].includes(node.operatorToken.kind)
        ) {
          inspectClasses(node.left);
          inspectClasses(node.right);
        }
        return;
      }
      if (ts.isIdentifier(node)) {
        inspectClasses(resolve(node));
        return;
      }
      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        let object = node.expression;
        const seen = new Set();
        while (ts.isIdentifier(object) && !seen.has(object)) {
          seen.add(object);
          object = resolve(object);
          if (!object) {
            // Resolve map iteration parameters through their receiver binding.
            for (let parent = node; parent; parent = parent.parent) {
              if (!ts.isArrowFunction(parent) || !parent.parameters.some((p) => p.name.getText(ast) === node.expression.getText(ast))) continue;
              const call = parent.parent;
              if (ts.isCallExpression(call) && ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === 'map') {
                const receiver = call.expression.expression;
                const array = ts.isIdentifier(receiver) ? resolve(receiver) : receiver;
                if (array && ts.isArrayLiteralExpression(array)) {
                  for (const element of array.elements) {
                    if (!ts.isObjectLiteralExpression(element)) continue;
                    const property = element.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(ast).replace(/['"]/g, '') === node.name?.text);
                    if (property) inspectClasses(property.initializer);
                  }
                }
              }
              break;
            }
            return;
          }
        }
        const key = ts.isPropertyAccessExpression(node) ? node.name.text : values(node.argumentExpression)[0];
        if (ts.isObjectLiteralExpression(object)) {
          const property = object.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(ast).replace(/['"]/g, '') === key);
          if (property) inspectClasses(property.initializer);
        }
        return;
      }
      if (ts.isCallExpression(node)) {
        const helper = ts.isIdentifier(node.expression) && resolve(node.expression);
        if (helper && ts.isFunctionLike(helper)) inspectClasses(helper);
        else if (classUtilities.has(node.expression.getText(ast))) {
          for (const argument of node.arguments) inspectClassArgument(argument, node.expression.getText(ast));
        }
        return;
      }
      if (ts.isFunctionLike(node)) {
        if (!node.body) return;
        if (!ts.isBlock(node.body)) inspectClasses(node.body);
        else {
          function returns(child) {
            if (ts.isFunctionLike(child)) return;
            if (ts.isReturnStatement(child)) inspectClasses(child.expression);
            else ts.forEachChild(child, returns);
          }
          returns(node.body);
        }
        return;
      }
      if (ts.isTemplateExpression(node) || (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken)) {
        const assembled = values(node);
        const unresolvedFamily = ts.isTemplateExpression(node) && /\b(?:bg|text|border|ring(?:-offset)?|from|to|via|fill|stroke|decoration|outline|divide)-\$\{[^}]+\}-\d{2,3}\b/.test(node.getText(ast));
        if (assembled.some((value) => palette.test(value) || literal.test(value)) || unresolvedFamily) {
          violations.push({file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, rule: 'palette-color'});
        }
        return;
      }
      if (
        (ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node)) &&
        (palette.test(node.text) || literal.test(node.text))
      ) {
        matchedClasses.add(node.text);
        violations.push({
          file,
          line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
          rule: 'palette-color',
        });
      }
      ts.forEachChild(node, inspectClasses);
    }
    const classUtilities = new Set(['cva', 'tv', 'cn', 'clsx', 'twMerge', 'classNames']);
    function inspectClassArgument(node, utility) {
      if (ts.isObjectLiteralExpression(node)) {
        for (const property of node.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = property.name.getText(ast).replace(/['"]/g, '');
          if (key === 'class' || key === 'className' || key === 'variants' || key === 'compoundVariants') inspectClasses(property.initializer);
          else if (utility === 'cn' || utility === 'clsx' || utility === 'classNames' || utility === 'twMerge') inspectClasses(property.name);
        }
      } else inspectClasses(node);
    }
    function findClasses(node) {
      if (ts.isCallExpression(node) && classUtilities.has(node.expression.getText(ast))) inspectClasses(node);
      if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'className') {
        inspectClasses(node.initializer);

      }
      ts.forEachChild(node, findClasses);
    }
    findClasses(ast);
  }
  return violations;
}

export function countViolations(violations) {
  const files = {};
  for (const { file, rule } of violations) {
    files[file] ??= {};
    files[file][rule] = (files[file][rule] ?? 0) + 1;
  }
  return files;
}

export function checkRatchet(violations, baseline, zeroFiles = []) {
  const errors = [];
  const counts = countViolations(violations);
  const zero = new Set([...(baseline.zeroFiles ?? []), ...zeroFiles]);
  for (const [file, rules] of Object.entries(counts)) {
    if (zero.has(file))
      errors.push(
        `${file}: migrated file requires zero violations (${Object.values(rules).reduce((a, b) => a + b, 0)} found)`,
      );
    for (const [rule, count] of Object.entries(rules)) {
      const limit = baseline.files?.[file]?.[rule] ?? 0;
      if (count > limit)
        errors.push(
          `${file}: ${rule} ${count} exceeds per-file baseline ${limit}`,
        );
    }
  }
  return errors;
}

export function compareBaselines(current, previous) {
  if (!previous) return [];
  const errors = [];
  for (const [file, rules] of Object.entries(current.files ?? {})) {
    for (const [rule, limit] of Object.entries(rules)) {
      if (
        !Number.isInteger(limit) ||
        limit < 0 ||
        limit > (previous.files?.[file]?.[rule] ?? 0)
      )
        errors.push(`${file}: baseline ${rule} may only decrease`);
    }
  }
  for (const file of previous.zeroFiles ?? [])
    if (!(current.zeroFiles ?? []).includes(file))
      errors.push(`${file}: migrated zero-file protection may not be removed`);
  return errors;
}

export function scanSource(root) {
  const files = fs
    .readdirSync(path.join(root, 'src'), { recursive: true })
    .filter((file) => /\.(?:tsx?|css)$/.test(file))
    .sort();
  return files.flatMap((file) =>
    detectViolations(
      fs.readFileSync(path.join(root, 'src', file), 'utf8'),
      `src/${file.replaceAll(path.sep, '/')}`,
    ),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const baseline = JSON.parse(
    fs.readFileSync(
      path.join(root, 'scripts/design-system-baseline.json'),
      'utf8',
    ),
  );
  const violations = scanSource(root);
  const zeroFiles = process.argv
    .slice(2)
    .filter((_, index, args) => args[index - 1] === '--zero');
  const args = process.argv.slice(2);
  const refIndex = args.indexOf('--baseline-ref');
  let ref = refIndex < 0 ? 'HEAD' : args[refIndex + 1];
  if (/^0+$/.test(ref ?? '')) ref = 'HEAD^';
  if (
    ref === 'HEAD^' &&
    execFileSync('git', ['rev-list', '--count', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim() === '1'
  )
    ref = 'HEAD';
  let previous;
  try {
    execFileSync('git', ['rev-parse', '--verify', ref], {
      cwd: root,
      stdio: 'pipe',
    });
    const exists = execFileSync(
      'git',
      [
        'ls-tree',
        '--name-only',
        ref,
        '--',
        'scripts/design-system-baseline.json',
      ],
      { cwd: root, encoding: 'utf8', stdio: 'pipe' },
    ).trim();
    // Only the initial introduction has no committed baseline to compare.
    if (exists)
      previous = JSON.parse(
        execFileSync(
          'git',
          ['show', `${ref}:scripts/design-system-baseline.json`],
          { cwd: root, encoding: 'utf8', stdio: 'pipe' },
        ),
      );
  } catch (error) {
    console.error(
      `Cannot verify committed design-system baseline at ${ref}: ${error.message}`,
    );
    process.exit(1);
  }
  const errors = [
    ...compareBaselines(baseline, previous),
    ...checkRatchet(violations, baseline, zeroFiles),
  ];
  for (const file of zeroFiles)
    if (!fs.existsSync(path.join(root, file)))
      errors.push(`${file}: explicit zero-file target does not exist`);
  if (process.argv.includes('--report'))
    for (const violation of violations)
      console.log(`${violation.file}:${violation.line} ${violation.rule}`);
  console.log(
    `Design system: ${violations.length} remaining violations in ${Object.keys(countViolations(violations)).length} files; ${errors.length} ratchet failures.`,
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  }
}
