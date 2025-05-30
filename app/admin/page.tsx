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

  const handleAddAchievement = async () => {
    if (!form.title.trim() || !form.description.trim()) return;

    const newRef = push(ref(database, `achievements/${selectedDay}`));
    await update(newRef, {
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin - {selectedDay}</h1>
      <div className="flex gap-2 mb-4">
        {(["friday", "saturday", "sunday"] as const).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 border rounded ${selectedDay === day ? "bg-blue-500 text-white" : "bg-white"}`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Nieuw achievement toevoegen */}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Nieuwe achievement toevoegen</h2>
        <input
          type="text"
          placeholder="Titel"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="block w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Beschrijving"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="block w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Afbeeldings-URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="block w-full mb-2 p-2 border rounded"
        />
        <button
          onClick={handleAddAchievement}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Toevoegen
        </button>
      </div>

      {/* Drag & drop lijst */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="achievementList">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {achievements.map((achievement, index) => (
                <Draggable key={achievement.id} draggableId={achievement.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-4 border rounded bg-white shadow"
                    >
                      <strong>{achievement.title}</strong>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
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
