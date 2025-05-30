"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update, push } from "firebase/database";
import { database } from "../../firebaseConfig";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Achievement {
  id: string;
  title: string;
  description: string;
  image: string;
  completed?: boolean;
  proof?: string | null;
  order?: number;
}

export default function AdminPage() {
  const [selectedDay, setSelectedDay] = useState<"friday" | "saturday" | "sunday">("friday");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [form, setForm] = useState({ title: "", description: "", image: "" });

  useEffect(() => {
    const dbRef = ref(database, `achievements/${selectedDay}`);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loaded: Achievement[] = Object.entries(data).map(([id, val]: any) => ({
        id,
        title: val.title,
        description: val.description,
        image: val.image,
        completed: val.completed,
        proof: val.proof,
        order: val.order ?? 0,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setAchievements(loaded);
    });
    return () => unsubscribe();
  }, [selectedDay]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(achievements);
    const [movedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, movedItem);

    const updates: any = {};
    newItems.forEach((item, index) => {
      updates[`achievements/${selectedDay}/${item.id}/order`] = index;
    });
    update(ref(database), updates);
    setAchievements(newItems);
  };

  const handleAdd = () => {
    if (!form.title || !form.description || !form.image) return;
    const newRef = push(ref(database, `achievements/${selectedDay}`));
    update(newRef, {
      title: form.title,
      description: form.description,
      image: form.image,
      completed: false,
      proof: null,
      order: achievements.length,
    });
    setForm({ title: "", description: "", image: "" });
  };

  return (
    <div className="p-4 min-h-screen bg-black text-white">
      <h1 className="text-xl font-bold mb-4">Admin: Achievements beheren</h1>
      <div className="flex gap-2 mb-4">
        {(["friday", "saturday", "sunday"] as const).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 border rounded font-bold ${selectedDay === day ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"}`}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Nieuwe achievement toevoegen</h2>
        <input
          type="text"
          placeholder="Titel"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full mb-2 p-2 rounded bg-gray-800 text-white"
        />
        <textarea
          placeholder="Beschrijving"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full mb-2 p-2 rounded bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Afbeeldings-URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="w-full mb-2 p-2 rounded bg-gray-800 text-white"
        />
        <button onClick={handleAdd} className="bg-green-500 px-4 py-2 rounded text-white font-bold">
          Toevoegen
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="achievementList">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {achievements.map((achievement, index) => (
                <Draggable key={achievement.id} draggableId={achievement.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-4 border rounded bg-gray-800 shadow"
                    >
                      <strong>{achievement.title}</strong>
                      <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                      {achievement.image && (
                        <img
                          src={achievement.image}
                          alt={achievement.title}
                          className="w-16 h-16 object-cover"
                        />
                      )}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
