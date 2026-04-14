export default function StudentGroups({
  activeTab,
  onTabChange,
  activeGroups,
  completedGroups,
  isLoading,
  onSelectGroup,
}) {
  const groups = activeTab === "active" ? activeGroups : completedGroups;

  return (
    <div className="page active" id="page-groups">
      <div className="tab-bar">
        <button
          type="button"
          className={`tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => onTabChange("active")}
        >
          Faol
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => onTabChange("completed")}
        >
          Tugagan
        </button>
      </div>

      <div className="card card-table">
        <table className="groups-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Guruh nomi</th>
              <th>Yo'nalishi</th>
              <th>O'qituvchi</th>
              <th>Boshlash vaqti</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">
                  {isLoading
                    ? "Yuklanmoqda..."
                    : activeTab === "active"
                      ? "Faol guruhlar yo'q"
                      : "Tugagan guruhlar yo'q"}
                </td>
              </tr>
            ) : (
              groups.map((group, index) => (
                <tr
                  key={group.id}
                  className="clickable-row"
                  onClick={() => onSelectGroup(group)}
                >
                  <td>{index + 1}</td>
                  <td className="table-bold">
                    <button
                      type="button"
                      className="table-link"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectGroup(group);
                      }}
                    >
                      {group.name}
                    </button>
                  </td>
                  <td>
                    <span className="badge-prog">
                      {group.course?.name || "-"}
                    </span>
                  </td>
                  <td>
                    <div className="teacher-avatar">
                      {group.teacherInitials || "-"}
                    </div>
                  </td>
                  <td>{group.startDateLabel || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
