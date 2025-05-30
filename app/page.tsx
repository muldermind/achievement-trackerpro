"use client";

import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebaseConfig";

declare global {
  interface Window {
    uploadcare: any;
  }
}

const UPLOADCARE_PUBLIC_KEY = "d1217cd20d649c303bd6";
const SUCCESS_SOUND_URL = "https://ucarecdn.com/64e3ee89-cecf-4995-bb1b-ad7aef31cbb3/achievementsucces.mp3";

// Achievement-type
interface Achievement {
  id: string;
  title: string;
  description: string;
  image: string;
  completed: boolean;
  proof: string | null;
}

export default function Page() {
  const [achievements, setAchievements] = useState<{
    friday: Achievement[];
    saturday: Achievement[];
    sunday: Achievement[];
  }>({ friday: [], saturday: [], sunday: [] });

  const [selectedDay, setSelectedDay] = useState<"friday" | "saturday" | "sunday">("friday");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  let audio: HTMLAudioElement | null = null;

  useEffect(() => {
    const dbRef = ref(database, "achievements");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setAchievements({ friday: [], saturday: [], sunday: [] });
        return;
      }

      const convert = (dayData: any): Achievement[] =>
        Object.entries(dayData || {}).map(([key, value]) => ({
          ...(value as Omit<Achievement, "id">),
          id: key,
        }));

      setAchievements({
        friday: convert(data.friday),
        saturday: convert(data.saturday),
        sunday: convert(data.sunday),
      });
    });
    return () => unsubscribe();
  }, []);

  const toggleAchievement = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const openUploadWidget = () => {
    if (typeof window === "undefined" || !window.uploadcare) {
      alert("Uploadcare widget is niet geladen");
      return;
    }

    audio = new Audio(SUCCESS_SOUND_URL);

    const widget = window.uploadcare.openDialog(null, {
      publicKey: UPLOADCARE_PUBLIC_KEY,
      imagesOnly: true,
      multiple: false,
    });

    widget.done((file: any) => {
      file.promise().then((info: any) => {
        if (selectedId !== null) {
          const achievementRef = ref(database, `achievements/${selectedDay}/${selectedId}`);
          update(achievementRef, {
            proof: info.cdnUrl,
            completed: true,
          });
        }

        if (audio) {
          audio.play().catch((e) => console.warn("Geluid kon niet worden afgespeeld:", e));
        }

        setSelectedId(null);
      });
    });
  };

  return (
    <main className="bg-black min-h-screen p-8 text-white font-sans">
      <h1 className="text-3xl font-bold mb-8 text-yellow-400">Vrijgezellenfeest Achievements</h1>

      <div className="flex gap-4 mb-8">
        {(["friday", "saturday", "sunday"] as const).map((day) => (
          <button
            key={day}
            className={`px-4 py-2 rounded font-semibold ${
              selectedDay === day ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"
            }`}
            onClick={() => {
              setSelectedDay(day);
              setSelectedId(null);
            }}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-w-md">
        {achievements[selectedDay]?.map((ach) => {
          const isSelected = selectedId === ach.id;

          const cardBorder = ach.completed ? "border-gray-600" : "border-gray-700";
          const cardBg = ach.completed ? "bg-gray-800" : "bg-[#1a1a1a]";

          return (
            <div
              key={ach.id}
              className={`border ${cardBorder} ${cardBg} p-4 rounded flex flex-col gap-4 transition duration-300`}
            >
              <div
                className="flex gap-4 items-center cursor-pointer"
                onClick={() => toggleAchievement(ach.id)}
              >
                <img
                  src={ach.image}
                  alt="icon"
                  className={`w-16 h-16 object-cover rounded ${
                    ach.completed
                      ? "filter grayscale-0 brightness-90"
                      : "filter grayscale brightness-50"
                  }`}
                />
                <div className="flex-1">
                  <h2 className="font-semibold">{ach.title}</h2>
                  <p>{ach.description}</p>
                </div>
              </div>

              {isSelected && !ach.completed && (
                <div className="mt-2">
                  <button
                    onClick={openUploadWidget}
                    className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold"
                  >
                    Upload bewijsfoto
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
