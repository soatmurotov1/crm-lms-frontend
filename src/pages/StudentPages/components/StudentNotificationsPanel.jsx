export default function StudentNotificationsPanel({
  notifications,
  unreadCount,
  onOpenNotification,
  onMarkAllRead,
}) {
  return (
    <div className="notif-panel" role="dialog" aria-label="Xabarlar">
      <div className="notif-panel-head">
        <div className="notif-panel-title">Xabarnomalar</div>
        <button
          type="button"
          className="notif-mark-all"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          Barchasini o'qildi
        </button>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">Yangi xabarlar yo'q</div>
        ) : (
          notifications.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`notif-item ${item.isRead ? "read" : "unread"}`}
              onClick={() => onOpenNotification(item)}
            >
              <div className="notif-item-title">{item.title}</div>
              <div className="notif-item-message">{item.message}</div>
              <div className="notif-item-time">{item.timeLabel}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
