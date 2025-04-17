"use client";

import { useState } from "react";

interface StoryMemoryProps {
  projectName: string;
}

const StoryMemory = ({ projectName }: StoryMemoryProps) => {
  const [activeSection, setActiveSection] = useState<string>("characters");

  return (
    <div className="h-full">
      <h2 className="text-2xl font-bold mb-4">Story Memory</h2>
      <p className="text-gray-400 mb-6">
        This section will allow you to manage your story&apos;s characters, settings, plot points, and themes.
      </p>

      {/* Memory tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`tab ${activeSection === "characters" ? "active" : ""}`}
          onClick={() => setActiveSection("characters")}
        >
          Characters
        </button>
        <button
          className={`tab ${activeSection === "settings" ? "active" : ""}`}
          onClick={() => setActiveSection("settings")}
        >
          Settings
        </button>
        <button
          className={`tab ${activeSection === "plot" ? "active" : ""}`}
          onClick={() => setActiveSection("plot")}
        >
          Plot Points
        </button>
        <button
          className={`tab ${activeSection === "themes" ? "active" : ""}`}
          onClick={() => setActiveSection("themes")}
        >
          Themes
        </button>
      </div>

      {/* Placeholder content */}
      <div className="bg-gray-800 p-6 rounded-lg text-center">
        <h3 className="text-xl mb-4">
          {activeSection === "characters" && "Character Management"}
          {activeSection === "settings" && "Settings Management"}
          {activeSection === "plot" && "Plot Points Management"}
          {activeSection === "themes" && "Themes Management"}
        </h3>
        <p className="text-gray-400">
          This feature is coming soon! You&apos;ll be able to manage your story&apos;s 
          {activeSection === "characters" && " characters and their relationships."}
          {activeSection === "settings" && " locations, world-building, and settings."}
          {activeSection === "plot" && " plot structure, key events, and story arcs."}
          {activeSection === "themes" && " themes, motifs, and symbolic elements."}
        </p>
      </div>
    </div>
  );
};

export default StoryMemory; 