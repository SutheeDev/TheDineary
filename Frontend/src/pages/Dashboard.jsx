import { useMemo } from "react";
import { useGlobalContext } from "../App";
import { Link } from "react-router-dom";
import { LuUtensilsCrossed } from "react-icons/lu";
import { FiMapPin } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { GiChopsticks } from "react-icons/gi";
import { getCuisineIcon, CATEGORIES, PRICE_OPTIONS } from "../utils/constants";

import styled from "styled-components";

// Show the most common cuisines individually, then roll the long tail into one
// "Other" bar so the chart never grows unbounded.
const TOP_CUISINES = 6;

const Dashboard = () => {
  const { restaurants } = useGlobalContext();

  const stats = useMemo(() => {
    const total = restaurants.length;

    const scores = restaurants
      .map((r) => r.finalScore)
      .filter((v) => v != null);
    const avgScore = scores.length
      ? scores.reduce((sum, v) => sum + v, 0) / scores.length
      : null;

    const cities = new Set(
      restaurants.map((r) => r.location?.city?.trim()).filter(Boolean)
    ).size;

    const dishes = restaurants.reduce(
      (sum, r) => sum + (r.dishes?.length || 0),
      0
    );

    const categoryAverages = CATEGORIES.map(({ key, label }) => {
      const vals = restaurants
        .map((r) => r.ratings?.[key])
        .filter((v) => typeof v === "number");
      const avg = vals.length
        ? vals.reduce((sum, v) => sum + v, 0) / vals.length
        : null;
      return { label, avg };
    });

    const cuisineCounts = {};
    restaurants.forEach((r) => {
      const c = r.cuisine?.trim();
      if (c) cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
    });
    let cuisines = Object.entries(cuisineCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    if (cuisines.length > TOP_CUISINES) {
      const head = cuisines.slice(0, TOP_CUISINES);
      const otherCount = cuisines
        .slice(TOP_CUISINES)
        .reduce((sum, c) => sum + c.count, 0);
      cuisines = [...head, { name: "Other", count: otherCount }];
    }
    const maxCuisine = cuisines.reduce((m, c) => Math.max(m, c.count), 0);

    const prices = PRICE_OPTIONS.map((label) => ({
      label,
      count: restaurants.filter((r) => r.priceRange === label).length,
    }));
    const maxPrice = prices.reduce((m, p) => Math.max(m, p.count), 0);

    return {
      total,
      avgScore,
      cities,
      dishes,
      categoryAverages,
      cuisines,
      maxCuisine,
      prices,
      maxPrice,
    };
  }, [restaurants]);

  return (
    <Wrapper>
      <div className="page-wrapper">
        <h1 className="heading">Dashboard</h1>
        <p className="subtitle">A summary of your dining history</p>

        {restaurants.length === 0 ? (
          <div className="empty-state">
            <LuUtensilsCrossed className="empty-icon" />
            <h2>No restaurants yet</h2>
            <p>Add a restaurant to start building your stats.</p>
            <Link to="/create" className="btn orange-btn">
              Add your first restaurant
            </Link>
          </div>
        ) : (
          <>
            <div className="tiles">
              <div className="tile">
                <LuUtensilsCrossed className="tile-icon" />
                <span className="tile-value">{stats.total}</span>
                <span className="tile-label">Restaurants logged</span>
              </div>
              <div className="tile">
                <FaStar className="tile-icon" />
                <span className="tile-value">
                  {stats.avgScore != null ? stats.avgScore.toFixed(1) : "-"}
                </span>
                <span className="tile-label">Average score</span>
              </div>
              <div className="tile">
                <FiMapPin className="tile-icon" />
                <span className="tile-value">{stats.cities}</span>
                <span className="tile-label">Cities visited</span>
              </div>
              <div className="tile">
                <GiChopsticks className="tile-icon" />
                <span className="tile-value">{stats.dishes}</span>
                <span className="tile-label">Dishes logged</span>
              </div>
            </div>

            <div className="panels">
              <section className="panel">
                <h2 className="panel-title">Category averages</h2>
                <div className="bars">
                  {stats.categoryAverages.map(({ label, avg }) => (
                    <div className="bar-row" key={label}>
                      <span className="bar-label">{label}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${((avg || 0) / 5) * 100}%` }}
                        />
                      </div>
                      <span className="bar-value">
                        {avg != null ? avg.toFixed(1) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2 className="panel-title">Top cuisines</h2>
                {stats.cuisines.length === 0 ? (
                  <p className="panel-empty">No cuisines recorded yet.</p>
                ) : (
                  <div className="bars">
                    {stats.cuisines.map(({ name, count }) => {
                      const CuisineIcon = getCuisineIcon(name);
                      return (
                        <div className="bar-row" key={name}>
                          <span className="bar-label">
                            <CuisineIcon />
                            {name}
                          </span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${
                                  stats.maxCuisine
                                    ? (count / stats.maxCuisine) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="bar-value">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="panel">
                <h2 className="panel-title">Price range</h2>
                <div className="bars">
                  {stats.prices.map(({ label, count }) => (
                    <div className="bar-row" key={label}>
                      <span className="bar-label">{label}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${
                              stats.maxPrice ? (count / stats.maxPrice) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="bar-value">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </Wrapper>
  );
};
export default Dashboard;

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

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 40px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 20px;
    border-radius: var(--card-radius);
    background-color: var(--bg-secondary-color);

    .tile-icon {
      font-size: 20px;
      color: var(--orange);
      margin-bottom: 6px;
    }

    .tile-value {
      font-family: var(--primary-font-medium);
      font-size: 28px;
      line-height: 1;
    }

    .tile-label {
      font-family: var(--primary-font-light);
      font-size: 14px;
      color: var(--text-third-color);
    }
  }

  .panels {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .panel {
    padding: 24px;
    border-radius: var(--card-radius);
    border: 1px solid var(--bg-secondary-color);
  }

  .panel-title {
    font-family: var(--primary-font-medium);
    font-size: 16px;
    margin-bottom: 20px;
  }

  .panel-empty {
    color: var(--text-third-color);
    font-family: var(--primary-font-light);
  }

  .bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* label | track | value, so every bar's track starts and ends on the same
     vertical lines regardless of label length. */
  .bar-row {
    display: grid;
    grid-template-columns: 110px 1fr 32px;
    align-items: center;
    gap: 12px;
  }

  .bar-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--primary-font-light);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    svg {
      flex-shrink: 0;
      font-size: 14px;
      color: var(--text-third-color);
    }
  }

  .bar-track {
    height: 10px;
    border-radius: 6px;
    background-color: var(--bg-secondary-color);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 6px;
    background-color: var(--orange);
    transition: width 0.2s ease;
  }

  .bar-value {
    font-family: var(--primary-font-medium);
    font-size: 14px;
    text-align: right;
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);

    .tiles {
      grid-template-columns: repeat(2, 1fr);
    }

    .panels {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .tiles {
      grid-template-columns: 1fr;
    }
  }
`;
