/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/products/page.tsx
 */

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../_components/AdminLayout";

interface Sale {
  id: number;
  date: string;
  product: string;
  client: string;
  amount: number;
}

interface Products {
  mini: { sales: number; paypalLink: string };
  mentoring: { sales: number };
  production: { sales: number };
}

const DEMO_SALES: Sale[] = [
  { id: 1, date: "15.03.2026", product: "Мини-курс", client: "—", amount: 30 },
  { id: 2, date: "01.03.2026", product: "Наставничество", client: "Алина М.", amount: 1500 },
  { id: 3, date: "01.03.2026", product: "Продюсирование", client: "Алина М.", amount: 3000 },
];

const DEFAULT_PRODUCTS: Products = {
  mini: { sales: 48, paypalLink: "" },
  mentoring: { sales: 1 },
  production: { sales: 1 },
};

function getTodayDate(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Products>(DEFAULT_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(DEMO_SALES);
  const [modal, setModal] = useState<"mentoring" | "production" | null>(null);
  const [modalClient, setModalClient] = useState("");
  const [modalAmount, setModalAmount] = useState("");

  useEffect(() => {
    const storedProducts = localStorage.getItem("products");
    const storedSales = localStorage.getItem("sales");
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedSales) setSales(JSON.parse(storedSales));
  }, []);

  function saveProducts(updated: Products) {
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
  }

  function saveSales(updated: Sale[]) {
    setSales(updated);
    localStorage.setItem("sales", JSON.stringify(updated));
  }

  function addMiniSale() {
    const updated: Products = {
      ...products,
      mini: { ...products.mini, sales: products.mini.sales + 1 },
    };
    saveProducts(updated);
    const newSale: Sale = {
      id: Date.now(),
      date: getTodayDate(),
      product: "Мини-курс",
      client: "—",
      amount: 30,
    };
    saveSales([newSale, ...sales]);
  }

  function updatePaypalLink(val: string) {
    saveProducts({ ...products, mini: { ...products.mini, paypalLink: val } });
  }

  function openModal(type: "mentoring" | "production") {
    setModalClient("");
    setModalAmount("");
    setModal(type);
  }

  function closeModal() {
    setModal(null);
  }

  function addModalSale() {
    if (!modal) return;
    const amount = parseFloat(modalAmount) || 0;
    const productLabel = modal === "mentoring" ? "Наставничество" : "Продюсирование";
    const updated: Products = {
      ...products,
      [modal]: { sales: (products[modal] as { sales: number }).sales + 1 },
    };
    saveProducts(updated);
    const newSale: Sale = {
      id: Date.now(),
      date: getTodayDate(),
      product: productLabel,
      client: modalClient || "—",
      amount,
    };
    saveSales([newSale, ...sales]);
    closeModal();
  }

  const miniRevenue = products.mini.sales * 30;
  const mentoringRevenue = sales
    .filter((s) => s.product === "Наставничество")
    .reduce((acc, s) => acc + s.amount, 0);
  const productionRevenue = sales
    .filter((s) => s.product === "Продюсирование")
    .reduce((acc, s) => acc + s.amount, 0);

  const styles = {
    page: {
      background: "#050710",
      minHeight: "100vh",
      padding: "32px 24px",
      fontFamily: "'Inter', sans-serif",
      color: "#e2e8f0",
    },
    heading: {
      fontSize: "24px",
      fontWeight: 700,
      marginBottom: "28px",
      color: "#fff",
    },
    cardsRow: {
      display: "flex",
      gap: "20px",
      flexWrap: "wrap" as const,
      marginBottom: "36px",
    },
    card: (accentColor: string): React.CSSProperties => ({
      background: "#0d1126",
      borderRadius: "12px",
      padding: "24px",
      flex: "1 1 280px",
      borderLeft: `4px solid ${accentColor}`,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }),
    cardTitle: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#fff",
    },
    cardPrice: (accentColor: string): React.CSSProperties => ({
      fontSize: "13px",
      fontWeight: 600,
      color: accentColor,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    }),
    statusBadge: {
      fontSize: "13px",
      color: "#86efac",
    },
    statRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "14px",
      color: "#94a3b8",
    },
    statValue: {
      color: "#e2e8f0",
      fontWeight: 600,
    },
    label: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "2px",
    },
    funnelRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      flexWrap: "wrap" as const,
      marginTop: "4px",
    },
    funnelStep: {
      background: "#1e2a4a",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "12px",
      color: "#a5b4fc",
    },
    funnelArrow: {
      color: "#5c6af0",
      fontSize: "14px",
    },
    inputField: {
      background: "#0a0f1f",
      border: "1px solid #1e2a4a",
      borderRadius: "8px",
      padding: "8px 12px",
      color: "#e2e8f0",
      fontSize: "13px",
      width: "100%",
      outline: "none",
      boxSizing: "border-box" as const,
    },
    addBtn: (accentColor: string): React.CSSProperties => ({
      background: accentColor,
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "4px",
      transition: "opacity 0.2s",
    }),
    divider: {
      height: "1px",
      background: "#1e2a4a",
      margin: "4px 0",
    },
    tableSection: {
      background: "#0d1126",
      borderRadius: "12px",
      padding: "24px",
    },
    tableHeading: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#fff",
      marginBottom: "16px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      fontSize: "14px",
    },
    th: {
      textAlign: "left" as const,
      padding: "10px 14px",
      color: "#64748b",
      fontWeight: 600,
      borderBottom: "1px solid #1e2a4a",
    },
    td: {
      padding: "10px 14px",
      color: "#cbd5e1",
      borderBottom: "1px solid #0f1830",
    },
    modalOverlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalBox: {
      background: "#0d1126",
      borderRadius: "14px",
      padding: "28px",
      width: "360px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "14px",
    },
    modalTitle: {
      fontSize: "17px",
      fontWeight: 700,
      color: "#fff",
    },
    modalLabel: {
      fontSize: "13px",
      color: "#94a3b8",
      marginBottom: "4px",
    },
    modalRow: {
      display: "flex",
      gap: "10px",
      marginTop: "4px",
    },
    cancelBtn: {
      background: "#1e2a4a",
      color: "#94a3b8",
      border: "none",
      borderRadius: "8px",
      padding: "10px 20px",
      fontSize: "13px",
      cursor: "pointer",
      flex: 1,
    },
    confirmBtn: {
      background: "#5c6af0",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 20px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      flex: 1,
    },
  };

  return (
    <AdminLayout>
    <div style={styles.page}>
      <div style={styles.heading}>Продукты и продажи</div>

      <div style={styles.cardsRow}>
        {/* Card 1: Mini-course */}
        <div style={styles.card("#5c6af0")}>
          <div style={styles.cardPrice("#5c6af0")}>Мини-курс $30</div>
          <div style={styles.cardTitle}>Автоворонка в Instagram за 3 дня</div>
          <div style={styles.statusBadge}>Активен ✅</div>
          <div style={styles.divider} />
          <div style={styles.statRow}>
            <span>Продажи</span>
            <span style={styles.statValue}>{products.mini.sales}</span>
          </div>
          <div style={styles.statRow}>
            <span>Выручка</span>
            <span style={styles.statValue}>${miniRevenue.toLocaleString()}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.label}>Воронка</div>
          <div style={styles.funnelRow}>
            {["Реклама", "Бот", "Оплата", "Доступ"].map((step, i, arr) => (
              <span key={step} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={styles.funnelStep}>{step}</span>
                {i < arr.length - 1 && <span style={styles.funnelArrow}>→</span>}
              </span>
            ))}
          </div>
          <div>
            <div style={styles.label}>PayPal ссылка</div>
            <input
              style={styles.inputField}
              type="text"
              placeholder="https://paypal.me/..."
              value={products.mini.paypalLink}
              onChange={(e) => updatePaypalLink(e.target.value)}
            />
          </div>
          <button style={styles.addBtn("#5c6af0")} onClick={addMiniSale}>
            + Добавить продажу
          </button>
        </div>

        {/* Card 2: Mentoring */}
        <div style={styles.card("#8b5cf6")}>
          <div style={styles.cardPrice("#8b5cf6")}>Наставничество $700–1500</div>
          <div style={styles.cardTitle}>Системные продажи через контент</div>
          <div style={styles.statusBadge}>Активен ✅</div>
          <div style={styles.divider} />
          <div style={styles.statRow}>
            <span>Продажи</span>
            <span style={styles.statValue}>{products.mentoring.sales}</span>
          </div>
          <div style={styles.statRow}>
            <span>Выручка</span>
            <span style={styles.statValue}>${mentoringRevenue.toLocaleString()}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.statRow}>
            <span>Длительность</span>
            <span style={styles.statValue}>1.5 месяца</span>
          </div>
          <div>
            <div style={styles.label}>Включает</div>
            <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6" }}>
              6 созвонов, чат 24/7, стратегия, контент-план
            </div>
          </div>
          <button style={styles.addBtn("#8b5cf6")} onClick={() => openModal("mentoring")}>
            + Добавить продажу
          </button>
        </div>

        {/* Card 3: Production */}
        <div style={styles.card("#22c55e")}>
          <div style={styles.cardPrice("#22c55e")}>Продюсирование $3000</div>
          <div style={styles.cardTitle}>Продюсирование под ключ</div>
          <div style={styles.statusBadge}>Активен ✅</div>
          <div style={styles.divider} />
          <div style={styles.statRow}>
            <span>Продажи</span>
            <span style={styles.statValue}>{products.production.sales}</span>
          </div>
          <div style={styles.statRow}>
            <span>Выручка</span>
            <span style={styles.statValue}>${productionRevenue.toLocaleString()}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.statRow}>
            <span>Длительность</span>
            <span style={styles.statValue}>3 месяца</span>
          </div>
          <button style={styles.addBtn("#22c55e")} onClick={() => openModal("production")}>
            + Добавить продажу
          </button>
        </div>
      </div>

      {/* Sales table */}
      <div style={styles.tableSection}>
        <div style={styles.tableHeading}>История продаж</div>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Дата", "Продукт", "Клиент", "Сумма"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td style={styles.td}>{sale.date}</td>
                <td style={styles.td}>{sale.product}</td>
                <td style={styles.td}>{sale.client}</td>
                <td style={{ ...styles.td, color: "#86efac", fontWeight: 600 }}>
                  ${sale.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for mentoring / production */}
      {modal && (
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={styles.modalBox}>
            <div style={styles.modalTitle}>
              Добавить продажу — {modal === "mentoring" ? "Наставничество" : "Продюсирование"}
            </div>
            <div>
              <div style={styles.modalLabel}>Имя клиента</div>
              <input
                style={styles.inputField}
                type="text"
                placeholder="Например: Алина М."
                value={modalClient}
                onChange={(e) => setModalClient(e.target.value)}
              />
            </div>
            <div>
              <div style={styles.modalLabel}>Сумма, $</div>
              <input
                style={styles.inputField}
                type="number"
                placeholder={modal === "mentoring" ? "700–1500" : "3000"}
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
              />
            </div>
            <div style={styles.modalRow}>
              <button style={styles.cancelBtn} onClick={closeModal}>Отмена</button>
              <button style={styles.confirmBtn} onClick={addModalSale}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  );
}
