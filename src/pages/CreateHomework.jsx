import { useState } from "react";

export default function CreateHomework() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    console.log({
      title,
      description,
    });
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">

      <h1 className="text-xl font-semibold mb-6">
        Yo'qlama va mavzu kiritish
      </h1>

      <div className="max-w-xl">

        <label className="block mb-2 font-medium">
          Mavzu
        </label>

        <input
          type="text"
          placeholder="CRM frontend"
          className="border w-full p-2 rounded mb-6"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="block mb-2 font-medium">
          Izoh
        </label>

        <textarea
          className="border w-full p-2 rounded mb-6"
          rows="5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={submit}
          className="bg-green-500 text-white px-6 py-2 rounded"
        >
          E'lon qilish
        </button>

      </div>

    </div>
  );
}