"use client";

interface KnowledgeGraphProps {
  projectName: string;
}

const KnowledgeGraph = ({ projectName }: KnowledgeGraphProps) => {
  return (
    <div className="h-full">
      <h2 className="text-2xl font-bold mb-4">Knowledge Graph</h2>
      <p className="text-gray-400 mb-6">
        This section will display a visual representation of your story elements and their relationships.
      </p>

      {/* Placeholder content */}
      <div className="bg-gray-800 p-6 rounded-lg text-center flex flex-col items-center">
        <div className="w-64 h-64 rounded-full bg-gray-700 flex items-center justify-center mb-8">
          <span className="text-6xl text-gray-500">🔍</span>
        </div>
        
        <h3 className="text-xl mb-4">Graph Visualization Coming Soon</h3>
        <p className="text-gray-400 max-w-lg">
          The knowledge graph will help you visualize the connections between characters,
          locations, events, and themes in your story. This will help you maintain
          consistency and discover new narrative possibilities.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeGraph; 