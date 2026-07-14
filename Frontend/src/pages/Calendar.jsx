import { useState, useMemo, useEffect, useRef } from "react";
import { useGlobalContext } from "../App";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTag,
  FiMapPin,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { getCuisineIcon } from "../utils/constants";

import styled from "styled-components";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Cap on chips shown per day before a "+N more" toggle appears.
const MAX_CHIPS = 3;

// Cap on dot indicators shown per day in the compact (small-screen) view.
const MAX_DOTS = 5;

// Switch to the compact dots + tap view exactly where the full-size chip grid
// (min-width 760px + 64px page padding = 824px) stops fitting the viewport.
const SMALL_SCREEN = "(max-width: 823px)";

// e.g. "Wed, Jul 3" for the small-screen day-detail heading.
const formatDayHeading = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(y, m, d));
};

// Local-date key so a card and this calendar always agree on which day an entry
// falls on (avoids a UTC-vs-local off-by-one).
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const Calendar = () => {
  const { restaurants } = useGlobalContext();
  const navigate = useNavigate();

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [expandedDay, setExpandedDay] = useState(null);

  // Small screens swap the in-cell name chips for compact dots and reveal a
  // selected day's entries in a panel below the grid.
  const [isSmall, setIsSmall] = useState(
    () => window.matchMedia(SMALL_SCREEN).matches
  );
  const [selectedDay, setSelectedDay] = useState(null);

  // Desktop-only hover card for a chip: holds the restaurant plus the chip's
  // on-screen rect used to position the card. A short show-delay (via the ref
  // timer) prevents flicker when the mouse sweeps across several chips.
  const [hovered, setHovered] = useState(null);
  const hoverTimer = useRef(null);

  const showHover = (r, target) => {
    clearTimeout(hoverTimer.current);
    const rect = target.getBoundingClientRect();
    hoverTimer.current = setTimeout(() => setHovered({ r, rect }), 120);
  };

  // Delay the close so the mouse can cross the gap from the chip onto the card;
  // hovering the card itself cancels this and keeps it open long enough to click.
  const scheduleHide = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(null), 300);
  };

  const cancelHide = () => {
    clearTimeout(hoverTimer.current);
  };

  useEffect(() => {
    const mq = window.matchMedia(SMALL_SCREEN);
    const handler = (e) => setIsSmall(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Default the selected day to today when the current month is in view,
  // otherwise clear it. Re-runs when the viewed month changes.
  useEffect(() => {
    const now = new Date();
    if (now.getFullYear() === year && now.getMonth() === month) {
      setSelectedDay(`${year}-${month}-${now.getDate()}`);
    } else {
      setSelectedDay(null);
    }
  }, [year, month]);

  const goToMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
    setExpandedDay(null);
  };

  const goToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setExpandedDay(null);
  };

  const jumpTo = (nextYear, nextMonth) => {
    setViewDate(new Date(nextYear, nextMonth, 1));
    setExpandedDay(null);
  };

  // Year dropdown options: earliest entry year (by effective date) up to the
  // current year, plus the year currently in view so an arrow-reached year is
  // never missing from the list.
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    let earliest = current;
    restaurants.forEach((r) => {
      const raw = r.visitDate || r.createdAt;
      if (!raw) return;
      const y = new Date(raw).getFullYear();
      if (y < earliest) earliest = y;
    });
    const start = Math.min(earliest, year);
    const end = Math.max(current, year);
    const out = [];
    for (let y = start; y <= end; y++) out.push(y);
    return out;
  }, [restaurants, year]);

  // Group the current month's entries by day. Each restaurant lands on exactly
  // one day: its visitDate ("Visited"), or its createdAt ("Added") when undated.
  const entriesByDay = useMemo(() => {
    const map = {};
    restaurants.forEach((r) => {
      const hasVisit = Boolean(r.visitDate);
      const raw = hasVisit ? r.visitDate : r.createdAt;
      if (!raw) return;
      const d = new Date(raw);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = dayKey(d);
      if (!map[key]) map[key] = [];
      map[key].push({ ...r, kind: hasVisit ? "visited" : "added" });
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name))
    );
    return map;
  }, [restaurants, year, month]);

  // Build the grid cells: leading blanks for the first-of-month offset, then one
  // cell per day of the month.
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) out.push(day);
    return out;
  }, [year, month]);

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  // A visit date can't be in the future (matches the create form's maxDate), so
  // only today or earlier days offer an "add" affordance.
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const isAddable = (day) => new Date(year, month, day) <= todayStart;

  // Open the create form pre-filled with this day's date. Building the ISO string
  // from local midnight matches how the form stores a manually picked date, so it
  // round-trips back onto the same calendar day.
  const addOnDay = (day) => {
    const visitDate = new Date(year, month, day).toISOString();
    navigate("/create", { state: { prefill: { visitDate }, from: "calendar" } });
  };

  // Clear a pending show-timer if the component unmounts mid-hover.
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const hoverCard = (() => {
    if (!hovered) return null;
    const { r, rect } = hovered;
    const CuisineIcon = getCuisineIcon(r.cuisine);
    const cover = r.images?.[0]?.url || r.image;
    // First two non-empty parts of the location, matching the Card component.
    const area = [r.location?.city, r.location?.state, r.location?.country]
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");
    // Anchor above the chip when there's vertical room, else below. Anchoring
    // by "bottom" for the above case means the card's height doesn't need to be
    // known in advance. Clamp left so the card never spills past the viewport.
    const placeAbove = rect.top > 200;
    const style = {
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 272)),
    };
    if (placeAbove) style.bottom = window.innerHeight - rect.top + 8;
    else style.top = rect.bottom + 8;

    return (
      <div
        className="hover-card"
        style={style}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        onClick={() => navigate(`/restaurant/${r._id}`)}
      >
        <div className="hover-head">
          {cover && <img className="hover-thumb" src={cover} alt="" />}
          <div className="hover-title">
            <span className="hover-name">{r.name}</span>
            {r.finalScore != null && (
              <span className="hover-score">
                <FaStar />
                {r.finalScore}
              </span>
            )}
          </div>
        </div>
        <span className={`hover-label ${r.kind}`}>
          {r.kind === "visited" ? "Visited" : "Added"}
        </span>
        {(r.cuisine || r.priceRange || r.category || area) && (
          <div className="hover-meta">
            {r.cuisine && (
              <span className="meta-item">
                <CuisineIcon />
                {r.cuisine}
              </span>
            )}
            {r.priceRange && <span className="meta-item">{r.priceRange}</span>}
            {r.category && (
              <span className="meta-item">
                <FiTag />
                {r.category}
              </span>
            )}
            {area && (
              <span className="meta-item">
                <FiMapPin />
                {area}
              </span>
            )}
          </div>
        )}
      </div>
    );
  })();

  return (
    <Wrapper>
      <div className="page-wrapper">
        <h1 className="heading">Calendar</h1>
        <p className="subtitle">Your restaurants by date</p>

        <div className="toolbar">
          <div className="month-nav">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
            >
              <FiChevronLeft />
            </button>
            <select
              value={month}
              onChange={(e) => jumpTo(year, Number(e.target.value))}
              aria-label="Select month"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => jumpTo(Number(e.target.value), month)}
              aria-label="Select year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
            >
              <FiChevronRight />
            </button>
          </div>

          <div className="right-controls">
            <div className="legend">
              <span className="legend-item">
                <span className="dot visited" />
                Visited
              </span>
              <span className="legend-item">
                <span className="dot added" />
                Added
              </span>
            </div>
            <button type="button" className="today-btn" onClick={goToToday}>
              Today
            </button>
          </div>
        </div>

        {restaurants.length === 0 && (
          <p className="calendar-hint">
            {isSmall
              ? "Tap a day to add your first restaurant."
              : "Hover a day and click + to add your first restaurant."}
          </p>
        )}

        <div className="calendar">
          <div className="weekdays">
            {WEEKDAYS.map((wd) => (
              <span key={wd}>{wd}</span>
            ))}
          </div>
          <div className="days">
            {cells.map((day, i) => {
              if (day === null)
                return <div key={`blank-${i}`} className="day blank" />;

              const key = `${year}-${month}-${day}`;
              const entries = entriesByDay[key] || [];
              const expanded = expandedDay === key;
              const shown = expanded ? entries : entries.slice(0, MAX_CHIPS);
              const hidden = entries.length - shown.length;

              // Small screens: the whole cell is tappable and shows dots
              // instead of name chips; the tapped day's entries appear in the
              // panel below the grid.
              if (isSmall) {
                const extraDots = entries.length - MAX_DOTS;
                return (
                  <div
                    key={key}
                    className={`day compact${isToday(day) ? " today" : ""}${
                      selectedDay === key ? " selected" : ""
                    }`}
                    onClick={() => setSelectedDay(key)}
                  >
                    <span className="day-num">{day}</span>
                    {entries.length > 0 && (
                      <div className="dots">
                        {entries.slice(0, MAX_DOTS).map((r) => (
                          <span key={r._id} className={`dot ${r.kind}`} />
                        ))}
                        {extraDots > 0 && (
                          <span className="dot-more">+{extraDots}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={key} className={`day${isToday(day) ? " today" : ""}`}>
                  <span className="day-num">{day}</span>
                  {isAddable(day) && (
                    <button
                      type="button"
                      className="add-day"
                      aria-label={`Add entry on ${month + 1}/${day}`}
                      onClick={() => addOnDay(day)}
                    >
                      <FiPlus />
                    </button>
                  )}
                  <div className="entries">
                    {shown.map((r) => (
                      <button
                        key={r._id}
                        type="button"
                        className="entry"
                        onMouseEnter={(e) => showHover(r, e.currentTarget)}
                        onMouseLeave={scheduleHide}
                        onClick={() => navigate(`/restaurant/${r._id}`)}
                      >
                        <span className={`dot ${r.kind}`} />
                        <span className="entry-name">{r.name}</span>
                      </button>
                    ))}
                    {hidden > 0 && (
                      <button
                        type="button"
                        className="more"
                        onClick={() => setExpandedDay(key)}
                      >
                        +{hidden} more
                      </button>
                    )}
                    {expanded && entries.length > MAX_CHIPS && (
                      <button
                        type="button"
                        className="more"
                        onClick={() => setExpandedDay(null)}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isSmall && (
            <div className="day-detail">
              {selectedDay ? (
                <>
                  <div className="detail-header">
                    <h3 className="detail-date">
                      {formatDayHeading(selectedDay)}
                    </h3>
                    {isAddable(Number(selectedDay.split("-")[2])) && (
                      <button
                        type="button"
                        className="add-day-btn"
                        onClick={() =>
                          addOnDay(Number(selectedDay.split("-")[2]))
                        }
                      >
                        <FiPlus />
                        Add on this day
                      </button>
                    )}
                  </div>
                  {(entriesByDay[selectedDay] || []).length > 0 ? (
                    <div className="detail-list">
                      {entriesByDay[selectedDay].map((r) => (
                        <button
                          key={r._id}
                          type="button"
                          className="entry"
                          onClick={() => navigate(`/restaurant/${r._id}`)}
                        >
                          <span className={`dot ${r.kind}`} />
                          <span className="entry-name">{r.name}</span>
                          <span className="entry-label">
                            {r.kind === "visited" ? "Visited" : "Added"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="detail-empty">No entries on this day.</p>
                  )}
                </>
              ) : (
                <p className="detail-empty">Select a day to see its entries.</p>
              )}
            </div>
          )}
        </div>
      </div>
      {hoverCard}
    </Wrapper>
  );
};
export default Calendar;

const Wrapper = styled.div`
  padding-right: var(--container-padding);
  padding-bottom: var(--container-padding);
  width: 100%;

  .heading {
    margin-bottom: 4px;
  }

  .subtitle {
    color: var(--text-third-color);
    margin-bottom: 30px;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 30px;
  }

  .month-nav {
    display: flex;
    align-items: center;
    gap: 12px;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border: none;
      border-radius: var(--form-radius);
      background-color: var(--bg-secondary-color);
      cursor: pointer;
      font-size: 18px;
      color: inherit;
    }

    select {
      height: 42px;
      box-sizing: border-box;
      margin: 0;
      outline: none;
      border: none;
      padding: 0 32px 0 12px;
      border-radius: var(--form-radius);
      background-color: var(--bg-secondary-color);
      cursor: pointer;
      font: inherit;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 14px;

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--primary-font-light);
      font-size: 13px;
      color: var(--text-third-color);
    }
  }

  .today-btn {
    height: 42px;
    box-sizing: border-box;
    padding: 0 16px;
    border: none;
    border-radius: var(--form-radius);
    background-color: var(--bg-secondary-color);
    cursor: pointer;
    font: inherit;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.visited {
      background-color: var(--orange);
    }

    &.added {
      background-color: var(--gray-600);
    }
  }

  .calendar {
    overflow-x: auto;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 8px;
    min-width: 760px;

    span {
      font-family: var(--primary-font-light);
      font-size: 13px;
      color: var(--text-third-color);
      text-align: left;
      padding-left: 4px;
    }
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    min-width: 760px;
  }

  .day {
    position: relative;
    min-height: 110px;
    border-radius: var(--card-radius);
    background-color: var(--bg-third-color);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.blank {
      background-color: transparent;
    }

    &.today {
      outline: 2px solid var(--orange);
      outline-offset: -2px;
    }
  }

  .add-day {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 50%;
    background-color: var(--bg-secondary-color);
    color: var(--orange);
    cursor: pointer;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .day:hover .add-day,
  .add-day:focus-visible {
    opacity: 1;
  }

  .day-num {
    font-family: var(--primary-font-medium);
    font-size: 13px;
    color: var(--text-third-color);
    padding: 2px 4px;
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .entry {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-width: 0;
    border: none;
    background-color: var(--bg-secondary-color);
    border-radius: var(--form-radius);
    padding: 4px 6px;
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition: background 0.1s ease;

    &:hover {
      filter: brightness(0.96);
    }

    .entry-name {
      font-family: var(--primary-font-light);
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .more {
    border: none;
    background: transparent;
    padding: 2px 6px;
    font-family: var(--primary-font-light);
    font-size: 12px;
    color: var(--text-third-color);
    cursor: pointer;
    text-align: left;
  }

  /* Custom hover card replacing the native title tooltip. Fixed-positioned so
     it escapes the calendar's horizontal-scroll clipping. It stays interactive
     so the mouse can move onto it and click through to the restaurant. */
  .hover-card {
    position: fixed;
    z-index: 50;
    width: 260px;
    max-width: calc(100vw - 24px);
    background-color: var(--bg-color);
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    padding: 12px 14px;
    pointer-events: auto;
    cursor: pointer;

    .hover-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .hover-thumb {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      object-fit: cover;
      border-radius: var(--form-radius);
    }

    .hover-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .hover-name {
      font-family: var(--primary-font-medium);
      font-size: 15px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hover-score {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      font-size: 14px;

      svg {
        color: var(--text-secondary-color);
      }
    }

    .hover-label {
      display: inline-block;
      font-family: var(--primary-font-light);
      font-size: 12px;
      color: var(--text-third-color);

      &.visited {
        color: var(--orange);
      }
    }

    .hover-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: var(--primary-font-light);
      font-size: 13px;
      color: var(--gray-600);
      background-color: var(--bg-secondary-color);
      padding: 3px 9px;
      border-radius: var(--btn-radius);

      svg {
        font-size: 13px;
        flex-shrink: 0;
      }
    }
  }

  .calendar-hint {
    margin-bottom: 20px;
    font-family: var(--primary-font-light);
    font-size: 14px;
    color: var(--text-third-color);
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);
  }

  /* Compact dots + tap view. Triggers where the full-size chip grid (760px +
     64px padding) stops fitting; matches the SMALL_SCREEN matchMedia query. */
  @media (max-width: 823px) {
    /* Compact month grid: fit the viewport instead of scrolling sideways. */
    .weekdays,
    .days {
      min-width: 0;
      gap: 4px;
    }

    .weekdays span {
      font-size: 11px;
      text-align: center;
      padding-left: 0;
    }

    .day {
      min-height: 52px;
      padding: 4px 3px;
      gap: 3px;
      cursor: pointer;
    }

    .day.selected {
      background-color: var(--bg-secondary-color);
      outline: 2px solid var(--orange);
      outline-offset: -2px;
    }

    .day-num {
      font-size: 12px;
      padding: 0;
      text-align: center;
    }

    .dots {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 3px;
    }

    .dot-more {
      font-family: var(--primary-font-light);
      font-size: 10px;
      line-height: 1;
      color: var(--text-third-color);
    }

    .day-detail {
      margin-top: 20px;

      .detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .detail-date {
        font-family: var(--primary-font-medium);
        font-size: 16px;
      }

      .add-day-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        height: 34px;
        padding: 0 12px;
        border: none;
        border-radius: var(--form-radius);
        background-color: var(--bg-secondary-color);
        color: var(--orange);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
      }

      .detail-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .entry {
        padding: 10px 12px;
      }

      .entry-label {
        margin-left: auto;
        flex-shrink: 0;
        font-family: var(--primary-font-light);
        font-size: 12px;
        color: var(--text-third-color);
      }

      .detail-empty {
        color: var(--text-third-color);
      }
    }
  }

  @media (max-width: 639px) {
    .toolbar {
      justify-content: flex-start;
    }

    .right-controls {
      width: 100%;
      justify-content: space-between;
    }
  }
`;
