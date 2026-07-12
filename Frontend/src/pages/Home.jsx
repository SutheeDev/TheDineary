import { useState, useEffect, useMemo } from "react";
import { Card, Loading } from "../components/index";
import { useGlobalContext } from "../App";
import apiClient from "../utils/apiClient";
import { Link } from "react-router-dom";
import { LuUtensilsCrossed } from "react-icons/lu";
import { FiSearch } from "react-icons/fi";

import styled from "styled-components";

// Sentinel a filter sends to fetch entries that have no value for that field, so
// blank entries are findable. The backend maps it to "missing or empty".
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

const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "finalScore", label: "Final score" },
  { value: "name", label: "Name" },
  { value: "priceRange", label: "Price" },
];

// Direction labels change meaning per sort field, e.g. "Newest" vs "Highest".
// Each field lists its directions in natural order (primary one first).
// "date" is the unified sort: each entry's visit date, or its added date when it
// has no visit date.
const DIRECTION_LABELS = {
  date: { desc: "Newest first", asc: "Oldest first" },
  finalScore: { desc: "Highest first", asc: "Lowest first" },
  name: { asc: "A to Z", desc: "Z to A" },
  priceRange: { asc: "Low to high", desc: "High to low" },
};

// One flat list combining each field with each direction, so the field and
// direction can live in a single dropdown. Value encodes both as "field-order".
const SORT_CHOICES = SORT_OPTIONS.flatMap((s) =>
  Object.entries(DIRECTION_LABELS[s.value]).map(([order, label]) => ({
    value: `${s.value}-${order}`,
    label: `${s.label} (${label})`,
  }))
);

const Home = () => {
  const { user, restaurants } = useGlobalContext();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [category, setCategory] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [list, setList] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // Cuisine options come from the full, unfiltered global list.
  const cuisineOptions = useMemo(() => {
    const values = restaurants
      .map((res) => res.cuisine)
      .filter((c) => c && c.trim());
    return [...new Set(values)].sort();
  }, [restaurants]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchList = async () => {
      setIsFetching(true);
      try {
        const params = { sort: sortKey, order: sortOrder };
        if (debouncedSearch) params.search = debouncedSearch;
        if (cuisine) params.cuisine = cuisine;
        if (priceRange) params.priceRange = priceRange;
        if (category) params.category = category;

        const { data } = await apiClient.get("/restaurants", { params });
        setList(data);
      } catch {
        // 401 is handled by the apiClient interceptor
      } finally {
        setIsFetching(false);
      }
    };

    fetchList();
  }, [debouncedSearch, cuisine, priceRange, category, sortKey, sortOrder]);

  const hasFilters = Boolean(
    debouncedSearch || cuisine || priceRange || category
  );

  return (
    <CardsContainer>
      <div className="page-wrapper">
        <h1 className="heading">
          {user.name ? `Welcome ${user.name}` : "Welcome"}
        </h1>
        <p className="subtitle">Your restaurant diary</p>

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
            value={`${sortKey}-${sortOrder}`}
            onChange={(e) => {
              const [key, order] = e.target.value.split("-");
              setSortKey(key);
              setSortOrder(order);
            }}
            aria-label="Sort by"
          >
            {SORT_CHOICES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {isFetching && list.length === 0 ? (
          <Loading />
        ) : list.length === 0 ? (
          hasFilters ? (
            <div className="empty-state">
              <LuUtensilsCrossed className="empty-icon" />
              <h2>No matches</h2>
              <p>No restaurants match your search or filters.</p>
            </div>
          ) : (
            <div className="empty-state">
              <LuUtensilsCrossed className="empty-icon" />
              <h2>No restaurants yet</h2>
              <p>Start your food diary by adding your first visit.</p>
              <Link to="/create" className="btn orange-btn">
                Add your first restaurant
              </Link>
            </div>
          )
        ) : (
          <section className="cards">
            {list.map((res) => (
              <Card key={res._id} restaurant={res} />
            ))}
          </section>
        )}
      </div>
    </CardsContainer>
  );
};
export default Home;

const CardsContainer = styled.div`
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
      /* Extra right padding leaves room for the custom chevron, whose 10px gap
         from the edge matches the 10px text gap on the left. */
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

  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--cards-gap);
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);

    .cards {
      grid-template-columns: repeat(2, 1fr);
    }

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
    .cards {
      grid-template-columns: 1fr;
    }

    .toolbar select {
      flex: 1 1 calc(50% - 6px);
    }
  }
`;
