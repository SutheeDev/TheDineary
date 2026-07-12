import { useState, useEffect, useMemo } from "react";
import { useGlobalContext } from "../App";
import { Link, useNavigate } from "react-router-dom";
import { LuUtensilsCrossed } from "react-icons/lu";
import { FiSearch, FiShare2, FiTag, FiMapPin } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { getCuisineIcon } from "../utils/constants";

import styled from "styled-components";

// Sentinel a filter sends to match entries that have no value for that field, so
// blank entries are still findable. Same convention as Home.
const NO_VALUE = "__none__";

const PRICE_OPTIONS = ["$", "$$", "$$$", "$$$$"];

const CATEGORY_OPTIONS = [
  "Restaurant",
  "Coffee Shop",
  "Bakery / Pastry",
  "Bar",
  "Dessert",
  "Street Food",
  "Other",
];

const TOP_N_OPTIONS = [3, 5, 10, 25];

// A natural-language word per price tag, used only when building a shareable
// title like "My Top 3 Cheap Pizza in Bangkok".
const PRICE_LABELS = {
  $: "Cheap",
  $$: "Affordable",
  $$$: "Upscale",
  $$$$: "Fine-dining",
};

// First two non-empty parts of a restaurant's location, e.g. "Tokyo, Japan".
const areaOf = (r) =>
  [r.location?.city, r.location?.state, r.location?.country]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

const Ranking = () => {
  const { restaurants, showToast } = useGlobalContext();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [topN, setTopN] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Dropdown options come from the full, unfiltered global list.
  const cuisineOptions = useMemo(() => {
    const values = restaurants
      .map((res) => res.cuisine)
      .filter((c) => c && c.trim());
    return [...new Set(values)].sort();
  }, [restaurants]);

  const cityOptions = useMemo(() => {
    const values = restaurants
      .map((res) => res.location?.city)
      .filter((c) => c && c.trim());
    return [...new Set(values)].sort();
  }, [restaurants]);

  // The ranked list: only rated entries, filtered, sorted by final score
  // (highest first, ties broken by name), then capped to the chosen "top N".
  const ranked = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const matchField = (val, filter) => {
      if (!filter) return true;
      if (filter === NO_VALUE) return !val;
      return val === filter;
    };

    let out = restaurants
      .filter((r) => r.finalScore != null)
      .filter((r) => {
        if (q && !r.name?.toLowerCase().includes(q)) return false;
        if (!matchField(r.cuisine, cuisine)) return false;
        if (!matchField(r.priceRange, priceRange)) return false;
        if (!matchField(r.category, category)) return false;
        if (!matchField(r.location?.city, city)) return false;
        return true;
      });

    out.sort(
      (a, b) => b.finalScore - a.finalScore || a.name.localeCompare(b.name)
    );

    if (topN !== "all") out = out.slice(0, Number(topN));
    return out;
  }, [restaurants, debouncedSearch, cuisine, priceRange, category, city, topN]);

  const buildShareText = () => {
    const bits = [];
    if (topN !== "all") bits.push(`Top ${topN}`);
    if (priceRange && priceRange !== NO_VALUE)
      bits.push(PRICE_LABELS[priceRange] || priceRange);
    if (cuisine && cuisine !== NO_VALUE) bits.push(cuisine);
    if (category && category !== NO_VALUE) bits.push(category);

    const hasNoun =
      (cuisine && cuisine !== NO_VALUE) || (category && category !== NO_VALUE);
    if (!hasNoun) bits.push("Restaurants");

    let title = `My ${bits.join(" ")}`.replace(/\s+/g, " ").trim();
    if (city && city !== NO_VALUE) title += ` in ${city}`;

    const body = ranked
      .map((r, i) => {
        const info = [r.cuisine, r.priceRange, areaOf(r)]
          .filter(Boolean)
          .join(" | ");
        return `${i + 1}. ${r.name} - ${r.finalScore}/5${
          info ? ` | ${info}` : ""
        }`;
      })
      .join("\n");

    return `${title}\n\n${body}`;
  };

  const handleShare = async () => {
    if (ranked.length === 0) return;
    try {
      await navigator.clipboard.writeText(buildShareText());
      showToast("Ranking copied to clipboard", "success");
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  };

  return (
    <Wrapper>
      <div className="page-wrapper">
        <h1 className="heading">Ranking</h1>
        <p className="subtitle">Your restaurants ranked by final score</p>

        <div className="toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search restaurants by name"
            />
          </div>

          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            aria-label="Filter by cuisine"
          >
            <option value="">All cuisines</option>
            {cuisineOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NO_VALUE}>Unspecified</option>
          </select>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            aria-label="Filter by price"
          >
            <option value="">All prices</option>
            {PRICE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value={NO_VALUE}>Unspecified</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NO_VALUE}>Unspecified</option>
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Filter by city"
          >
            <option value="">All cities</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NO_VALUE}>Unspecified</option>
          </select>

          <select
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
            aria-label="Show top N"
          >
            <option value="all">Top: All</option>
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Top: {n}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="share-btn"
            onClick={handleShare}
            disabled={ranked.length === 0}
          >
            <FiShare2 />
            Share
          </button>
        </div>

        {restaurants.length === 0 ? (
          <div className="empty-state">
            <LuUtensilsCrossed className="empty-icon" />
            <h2>No restaurants yet</h2>
            <p>Add and rate a restaurant to build your ranking.</p>
            <Link to="/create" className="btn orange-btn">
              Add your first restaurant
            </Link>
          </div>
        ) : ranked.length === 0 ? (
          <div className="empty-state">
            <LuUtensilsCrossed className="empty-icon" />
            <h2>No matches</h2>
            <p>No rated restaurants match your filters.</p>
          </div>
        ) : (
          <div className="ranking-table">
            <div className="table-head">
              <span>#</span>
              <span />
              <span>Restaurant</span>
              <span>Cuisine</span>
              <span>Price</span>
              <span>Category</span>
              <span>Location</span>
              <span className="th-score">Score</span>
            </div>
            {ranked.map((r, i) => {
              const CuisineIcon = getCuisineIcon(r.cuisine);
              const area = areaOf(r);
              return (
                <div
                  key={r._id}
                  className="rank-row"
                  onClick={() => navigate(`/restaurant/${r._id}`)}
                >
                  <span className="rank">{i + 1}</span>
                  <div className="thumb">
                    <img src={r.image} alt={r.name} />
                  </div>
                  <span className="name">{r.name}</span>
                  <span className="cell">
                    {r.cuisine ? (
                      <>
                        <CuisineIcon />
                        {r.cuisine}
                      </>
                    ) : (
                      <span className="empty">-</span>
                    )}
                  </span>
                  <span className="cell">
                    {r.priceRange || <span className="empty">-</span>}
                  </span>
                  <span className="cell">
                    {r.category ? (
                      <>
                        <FiTag />
                        {r.category}
                      </>
                    ) : (
                      <span className="empty">-</span>
                    )}
                  </span>
                  <span className="cell">
                    {area ? (
                      <>
                        <FiMapPin />
                        {area}
                      </>
                    ) : (
                      <span className="empty">-</span>
                    )}
                  </span>
                  <span className="score">
                    <FaStar className="score-icon" />
                    <span className="score-num">{r.finalScore}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Wrapper>
  );
};
export default Ranking;

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
    gap: 12px;
    margin-bottom: 40px;

    .search-box {
      flex: 1 1 240px;
      height: 42px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px 0 12px;
      border-radius: var(--form-radius);
      background-color: var(--bg-secondary-color);

      .search-icon {
        flex-shrink: 0;
        color: var(--text-third-color);
      }

      input {
        flex: 1;
        min-width: 0;
        height: 100%;
        margin: 0;
        outline: none;
        border: none;
        background-color: transparent;
        font: inherit;
        padding: 0;
      }
    }

    select {
      height: 42px;
      box-sizing: border-box;
      margin: 0;
      outline: none;
      border: none;
      padding: 0 32px 0 10px;
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

    .share-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      box-sizing: border-box;
      padding: 0 16px;
      border: none;
      border-radius: var(--form-radius);
      background-color: var(--orange);
      color: #fff;
      cursor: pointer;
      font: inherit;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 80px 20px;

    .empty-icon {
      font-size: 64px;
      color: var(--orange);
      margin-bottom: 8px;
    }

    h2 {
      font-family: var(--primary-font-medium);
      font-weight: 600;
    }

    p {
      color: var(--text-third-color);
    }

    .btn {
      margin-top: 8px;
    }
  }

  .ranking-table {
    overflow-x: auto;
  }

  /* Header and every row share this column template so cells line up into
     columns: rank | image | name | cuisine | price | category | location | score. */
  .table-head,
  .rank-row {
    display: grid;
    grid-template-columns: 32px 40px minmax(140px, 1.8fr) 150px 60px 150px minmax(
        120px,
        1fr
      ) 70px;
    align-items: center;
    gap: 16px;
    min-width: 760px;
  }

  .table-head {
    padding: 0 16px 10px;
    font-family: var(--primary-font-light);
    font-size: 13px;
    color: var(--text-third-color);
    border-bottom: 1px solid var(--bg-secondary-color);

    .th-score {
      justify-self: start;
    }
  }

  .rank-row {
    padding: 8px 16px;
    border-bottom: 1px solid var(--bg-secondary-color);
    cursor: pointer;
    transition: background 0.1s ease;

    &:hover {
      background-color: var(--bg-secondary-color);
    }
  }

  .rank {
    font-family: var(--primary-font-medium);
    font-size: 18px;
    color: var(--text-third-color);
  }

  .thumb {
    width: 40px;
    height: 40px;
    border-radius: var(--btn-radius);
    overflow: hidden;
  }

  .thumb img {
    width: 40px;
    height: 40px;
    object-fit: cover;
  }

  .name {
    font-family: var(--primary-font-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-family: var(--primary-font-light);
    font-size: 14px;
    color: var(--gray-600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cell svg {
    font-size: 14px;
    flex-shrink: 0;
  }

  .empty {
    color: var(--text-third-color);
  }

  .score {
    justify-self: start;
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--primary-font-medium);
  }

  /* Fixed-width, right-aligned so "3.8" and "3" share the same right edge while
     the star stays fixed on the left. */
  .score-num {
    min-width: 26px;
    text-align: right;
  }

  .score-icon {
    color: var(--text-secondary-color);
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);

    .toolbar {
      .search-box {
        flex-basis: 100%;
      }

      select {
        flex: 1 1 0;
        min-width: 0;
      }
    }
  }

  @media (max-width: 639px) {
    .toolbar select {
      flex: 1 1 calc(50% - 6px);
    }
  }
`;
