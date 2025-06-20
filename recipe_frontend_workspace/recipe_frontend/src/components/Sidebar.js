import React from 'react';
import './Sidebar.css';

// PUBLIC_INTERFACE
/**
 * Sidebar for recipe categories and quick filtering.
 */
export default function Sidebar({ categories, selected, onSelectCategory }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Categories</div>
      <ul className="sidebar-list">
        <li
          className={!selected ? "sidebar-item selected" : "sidebar-item"}
          onClick={() => onSelectCategory(null)}
        >
          All
        </li>
        {categories.map(cat => (
          <li
            key={cat}
            className={selected === cat ? "sidebar-item selected" : "sidebar-item"}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </li>
        ))}
      </ul>
    </aside>
  );
}
