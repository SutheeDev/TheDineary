import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../server.mjs";
import { registerUser, validRestaurant } from "./helpers.mjs";

let cookie;

beforeEach(async () => {
  ({ cookie } = await registerUser());
});

describe("Restaurant CRUD", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/restaurants");
    expect(res.status).toBe(401);
  });

  it("creates a restaurant and computes finalScore", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant({ ratings: { food: 4, service: 4, ambience: 4, value: 3.5 } }));

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Cafe");
    // (4 + 4 + 4 + 3.5) / 4 = 3.875, rounded to 1 decimal.
    expect(res.body.finalScore).toBe(3.9);
  });

  it("lists only the current user's restaurants", async () => {
    await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant({ name: "Mine" }));

    const res = await request(app).get("/api/restaurants").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Mine");
  });

  it("gets a single restaurant, and 404s for a missing id", async () => {
    const created = await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant());

    const found = await request(app)
      .get(`/api/restaurants/${created.body._id}`)
      .set("Cookie", cookie);
    expect(found.status).toBe(200);
    expect(found.body._id).toBe(created.body._id);

    const missing = await request(app)
      .get("/api/restaurants/60f1b9b3b3b3b3b3b3b3b3b3")
      .set("Cookie", cookie);
    expect(missing.status).toBe(404);
  });

  it("updates a restaurant and recomputes finalScore", async () => {
    const created = await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant());

    const res = await request(app)
      .patch(`/api/restaurants/${created.body._id}`)
      .set("Cookie", cookie)
      .send(validRestaurant({ name: "Renamed", ratings: { food: 5, service: 5, ambience: 5, value: 5 } }));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
    expect(res.body.finalScore).toBe(5);
  });

  it("deletes a restaurant, and 404s when deleting again", async () => {
    const created = await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant());

    const del = await request(app)
      .delete(`/api/restaurants/${created.body._id}`)
      .set("Cookie", cookie);
    expect(del.status).toBe(200);

    const again = await request(app)
      .delete(`/api/restaurants/${created.body._id}`)
      .set("Cookie", cookie);
    expect(again.status).toBe(404);
  });
});

// The core security property: one user must never see or touch another's data.
describe("Cross-user isolation", () => {
  it("hides and refuses access to another user's restaurant", async () => {
    const created = await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant({ name: "User A place" }));
    const id = created.body._id;

    const { cookie: cookieB } = await registerUser();

    const list = await request(app).get("/api/restaurants").set("Cookie", cookieB);
    expect(list.body).toHaveLength(0);

    const get = await request(app)
      .get(`/api/restaurants/${id}`)
      .set("Cookie", cookieB);
    expect(get.status).toBe(404);

    const patch = await request(app)
      .patch(`/api/restaurants/${id}`)
      .set("Cookie", cookieB)
      .send(validRestaurant({ name: "hacked" }));
    expect(patch.status).toBe(404);

    const del = await request(app)
      .delete(`/api/restaurants/${id}`)
      .set("Cookie", cookieB);
    expect(del.status).toBe(404);
  });
});

describe("Validation", () => {
  const cases = [
    ["a non-half-star rating", { ratings: { food: 3.3, service: 4, ambience: 4, value: 4 } }, /half-star/i],
    ["a rating above 5", { ratings: { food: 6, service: 4, ambience: 4, value: 4 } }, /between 0.5 and 5/i],
    ["a missing name", { name: "" }, /name is required/i],
    ["an invalid price range", { priceRange: "$$$$$" }, /price range/i],
    ["an invalid category", { category: "Nightclub" }, /category/i],
    ["a malformed visit date", { visitDate: "not-a-date" }, /valid date/i],
  ];

  for (const [label, override, pattern] of cases) {
    it(`rejects ${label} with 400`, async () => {
      const res = await request(app)
        .post("/api/restaurants")
        .set("Cookie", cookie)
        .send(validRestaurant(override));
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(pattern);
    });
  }
});

describe("Cuisine normalization", () => {
  it("trims and title-cases the cuisine on save", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Cookie", cookie)
      .send(validRestaurant({ cuisine: "  thai  food " }));
    expect(res.status).toBe(201);
    expect(res.body.cuisine).toBe("Thai Food");
  });
});

describe("Search, filter, and sort", () => {
  beforeEach(async () => {
    const make = (body) =>
      request(app).post("/api/restaurants").set("Cookie", cookie).send(validRestaurant(body));

    await make({
      name: "Momofuku",
      cuisine: "Ramen",
      priceRange: "$$",
      visitDate: "2024-01-01",
      ratings: { food: 3, service: 3, ambience: 3, value: 3 },
    });
    await make({
      name: "Thai Garden",
      cuisine: "Thai",
      priceRange: "$",
      visitDate: "2024-06-01",
      ratings: { food: 5, service: 5, ambience: 5, value: 5 },
    });
    // No cuisine and no visit date, so it sorts by createdAt (newest) and is the
    // one matched by the "unspecified cuisine" filter.
    await make({ name: "Nameless Spot", cuisine: "" });
  });

  it("searches by name, case-insensitively", async () => {
    const res = await request(app)
      .get("/api/restaurants?search=momo")
      .set("Cookie", cookie);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Momofuku");
  });

  it("filters by exact cuisine", async () => {
    const res = await request(app)
      .get("/api/restaurants?cuisine=Thai")
      .set("Cookie", cookie);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Thai Garden");
  });

  it("filters entries with no cuisine using the __none__ sentinel", async () => {
    const res = await request(app)
      .get("/api/restaurants?cuisine=__none__")
      .set("Cookie", cookie);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Nameless Spot");
  });

  it("sorts by finalScore descending", async () => {
    const res = await request(app)
      .get("/api/restaurants?sort=finalScore&order=desc")
      .set("Cookie", cookie);
    expect(res.body[0].name).toBe("Thai Garden");
  });

  it("defaults to effective-date sort (undated entry falls back to createdAt)", async () => {
    const res = await request(app).get("/api/restaurants").set("Cookie", cookie);
    // Newest first: the just-created undated entry (createdAt now) leads, then
    // the June visit, then the January visit.
    expect(res.body.map((r) => r.name)).toEqual([
      "Nameless Spot",
      "Thai Garden",
      "Momofuku",
    ]);
  });
});
