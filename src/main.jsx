import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { bootstrapSession } from "./api/client";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

const render = () =>
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );

/*
  Marshrut qorovullari (`RequireRole`) sinxron ishlaydi: ular tokenni o'qib,
  muddati o'tgan bo'lsa darhol login sahifasiga otadi. Shuning uchun token
  yangilash ilova chizilishidan OLDIN bajariladi — aks holda ertalab ishga
  kelgan o'qituvchi amaldagi sessiyasi bo'la turib parol so'ralgan sahifani
  ko'rardi.

  Yangilash tarmoqqa bog'liq, lekin natijasidan qat'i nazar ilova chiziladi:
  internet yo'q bo'lsa foydalanuvchi login sahifasini ko'radi, oq ekranni emas.
*/
bootstrapSession().finally(render);
