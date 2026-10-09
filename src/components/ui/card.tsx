import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dense?: boolean;
  edgeToEdge?: boolean;
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      dense = false,
      edgeToEdge = false,
      asChild = false,
      heading,
      description,
      action,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'div';
    return (
      <Component
        ref={ref}
        data-surface="card"
        data-density={dense ? 'dense' : 'default'}
        data-edge-to-edge={edgeToEdge || undefined}
        className={cn(
          'group/card rounded-lg border border-border bg-card text-card-foreground shadow-none',
          edgeToEdge ? 'overflow-hidden p-0' : dense ? 'p-3' : 'p-4',
          className,
        )}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {heading && (
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle as="h2">{heading}</CardTitle>
                  {description && (
                    <CardDescription className="mt-1">
                      {description}
                    </CardDescription>
                  )}
                </div>
                {action}
              </CardHeader>
            )}
            {children}
          </>
        )}
      </Component>
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-1.5 pb-4 group-data-[density=dense]/card:pb-3 group-data-[edge-to-edge=true]/card:p-4 group-data-[edge-to-edge=true]/card:group-data-[density=dense]/card:p-3',
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' }
>(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      'text-base font-semibold leading-snug text-balance',
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-[13px] text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('min-w-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center pt-4 group-data-[density=dense]/card:pt-3 group-data-[edge-to-edge=true]/card:p-4 group-data-[edge-to-edge=true]/card:group-data-[density=dense]/card:p-3',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
