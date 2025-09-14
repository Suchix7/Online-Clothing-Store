import React, { useEffect, useRef, useState } from "react";

const MasonryGrid = ({
  children,
  columnWidth = 280,
  gap = 16,
  className = "",
}) => {
  const containerRef = useRef(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newColumns = Math.floor(
          (containerWidth + gap) / (columnWidth + gap)
        );
        setColumns(Math.max(1, newColumns));
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [columnWidth, gap]);

  const getColumnHeights = () => new Array(columns).fill(0);

  const distributeItems = () => {
    const columnHeights = getColumnHeights();
    const columnItems = Array.from({ length: columns }, () => []);

    React.Children.forEach(children, (child, index) => {
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      );
      columnItems[shortestColumnIndex].push(
        <div key={index} className="mb-4">
          {child}
        </div>
      );
      columnHeights[shortestColumnIndex] += 300; // Approximate item height
    });

    return columnItems;
  };

  const columnItems = distributeItems();

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="flex" style={{ gap: `${gap}px` }}>
        {columnItems.map((items, columnIndex) => (
          <div
            key={columnIndex}
            className="flex-1"
            style={{ minWidth: `${columnWidth}px` }}
          >
            {items}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasonryGrid;
