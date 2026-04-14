export default function StudentPayments({
  stats,
  payments,
  isLoading,
  dateLabel,
  getStatusLabel,
}) {
  return (
    <div className="page active" id="page-payments">
      <div className="payment-cards">
        {stats.map((stat) => (
          <div key={stat.label} className={`pay-stat ${stat.tone}`}>
            <div className="pay-stat-label">{stat.label}</div>
            <div className="pay-stat-value">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="card card-table">
        <table className="payment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sana</th>
              <th>Guruh</th>
              <th>Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">
                  {isLoading ? "Yuklanmoqda..." : "To'lovlar topilmadi"}
                </td>
              </tr>
            ) : (
              payments.map((payment, index) => (
                <tr key={`${payment.groupId || payment.paymentId || index}`}>
                  <td>{index + 1}</td>
                  <td>{dateLabel}</td>
                  <td>{payment.groupName || "-"}</td>
                  <td>{payment.amountLabel}</td>
                  <td>
                    <span
                      className={
                        String(payment.status).toUpperCase() === "PAID"
                          ? "status-paid"
                          : "status-due"
                      }
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
