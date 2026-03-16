import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const defaultStudents = [
  { id: 1, name: "Sardor Xushvaqtov Bahodir o'g'li", time: "11 Mart, 2026 14:50", status: "kutayotgan" },
  { id: 2, name: "Jamoliddin Maxammadibrohimov Xusniddin o'g'li", time: "10 Mart, 2026 17:22", status: "kutayotgan" },
  { id: 3, name: "Abrorbek Soatmurotov Alimboy o'g'li", time: "10 Mart, 2026 13:36", status: "kutayotgan" },
  { id: 4, name: "Dilshod Olimov Farhod o'g'li", time: "10 Mart, 2026 15:39", status: "kutayotgan" },
  { id: 5, name: "Bunyodbek G'ulomjonov", time: "11 Mart, 2026 10:16", status: "kutayotgan" },
  { id: 6, name: "Axrorbek Mengilov", time: "10 Mart, 2026 19:53", status: "kutayotgan" },
  { id: 7, name: "Sirojiddin Oyosboyev", time: "10 Mart, 2026 13:54", status: "qabul" },
  { id: 8, name: "Olimjon Murtozoyev", time: "11 Mart, 2026 09:25", status: "qabul" },
  { id: 9, name: "Sabina Norbekova", time: "10 Mart, 2026 17:33", status: "qaytarilgan" },
  { id: 10, name: "Qo'chqorboyev Abbos Abulqosim o'g'li", time: "10 Mart, 2026 19:52", status: "bajarilmagan" },
];

export default function HomeworkDetailPage({ homework, onBack }) {
  const navigate = useNavigate();
  const { homeworkId } = useParams();

  const [tab, setTab] = useState("kutayotgan");

  const homeworkData = homework || {
    title: "crm continue backend finish",
    deadline: "11 Mart, 2026 01:30",
    studentStatuses: defaultStudents,
    id: homeworkId,
  };

  const studentList = homeworkData.studentStatuses || defaultStudents;
  const filtered = studentList.filter((s) => s.status === tab);
  const count = (status) => studentList.filter((s) => s.status === status).length;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <div onClick={handleBack} className="mb-4 text-gray-600 cursor-pointer">
        ← Orqaga
      </div>

      <h2 className="text-2xl font-bold">{homeworkData.title}</h2>

      <div className="flex gap-20 mt-4 text-sm text-gray-600">
        <div>
          <p>Mavzu</p>
          <p className="font-semibold text-black">{homeworkData.title}</p>
        </div>

        <div>
          <p>Tugash vaqti</p>
          <p className="font-semibold text-black">{homeworkData.deadline}</p>
        </div>
      </div>

      {}

      <div className="flex gap-8 mt-8 border-b">

        <button
        onClick={()=>setTab("kutayotgan")}
        className={`pb-3 ${tab==="kutayotgan" && "border-b-2 border-emerald-500 text-emerald-600"}`}>
          Kutayotganlar
          <span className="ml-2 bg-yellow-400 text-white text-xs px-2 rounded-full">
            {count("kutayotgan")}
          </span>
        </button>

        <button
        onClick={()=>setTab("qaytarilgan")}
        className={`pb-3 ${tab==="qaytarilgan" && "border-b-2 border-emerald-500 text-emerald-600"}`}>
          Qaytarilganlar
        </button>

        <button
        onClick={()=>setTab("qabul")}
        className={`pb-3 ${tab==="qabul" && "border-b-2 border-emerald-500 text-emerald-600"}`}>
          Qabul qilinganlar
        </button>

        <button
        onClick={()=>setTab("bajarilmagan")}
        className={`pb-3 ${tab==="bajarilmagan" && "border-b-2 border-emerald-500 text-emerald-600"}`}>
          Bajarilmagan
          <span className="ml-2 bg-yellow-400 text-white text-xs px-2 rounded-full">
            {count("bajarilmagan")}
          </span>
        </button>

      </div>

      {}

      <div className="mt-6 bg-white rounded-xl shadow">

        <div className="grid grid-cols-2 px-6 py-4 border-b text-sm text-gray-500 font-medium">
          <div>O'quvchi ismi</div>
          <div>Uyga vazifa jo'natilgan vaqt</div>
        </div>

        {filtered.map((student) => (
          <div
            key={student.id}
            className="grid grid-cols-2 px-6 py-4 border-b text-sm hover:bg-gray-50"
          >
            <div>{student.name}</div>
            <div>{student.sentAt || student.time || "-"}</div>
          </div>
        ))}

      </div>

    </div>
  );
}