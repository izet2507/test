from flask import Flask, request, jsonify, render_template
import sqlite3
import os
from datetime import date, datetime, timedelta

app = Flask(__name__)
DB = "cats.db"


def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS cats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                breed TEXT,
                birthdate TEXT,
                photo_emoji TEXT DEFAULT '🐱'
            );

            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cat_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                done_date TEXT NOT NULL,
                next_date TEXT,
                notes TEXT,
                FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
            );
        """)


# ── Cats ──────────────────────────────────────────────────────────────────────

@app.route("/api/cats", methods=["GET"])
def get_cats():
    with get_db() as conn:
        cats = conn.execute("SELECT * FROM cats ORDER BY name").fetchall()
        result = []
        for cat in cats:
            cat_dict = dict(cat)
            # Count records and upcoming reminders
            records_count = conn.execute(
                "SELECT COUNT(*) FROM records WHERE cat_id = ?", (cat["id"],)
            ).fetchone()[0]
            upcoming = conn.execute(
                "SELECT COUNT(*) FROM records WHERE cat_id = ? AND next_date IS NOT NULL AND next_date <= ?",
                (cat["id"], (date.today() + timedelta(days=30)).isoformat())
            ).fetchone()[0]
            overdue = conn.execute(
                "SELECT COUNT(*) FROM records WHERE cat_id = ? AND next_date IS NOT NULL AND next_date < ?",
                (cat["id"], date.today().isoformat())
            ).fetchone()[0]
            cat_dict["records_count"] = records_count
            cat_dict["upcoming"] = upcoming
            cat_dict["overdue"] = overdue
            result.append(cat_dict)
        return jsonify(result)


@app.route("/api/cats", methods=["POST"])
def add_cat():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO cats (name, breed, birthdate, photo_emoji) VALUES (?, ?, ?, ?)",
            (data["name"], data.get("breed", ""), data.get("birthdate", ""), data.get("photo_emoji", "🐱"))
        )
        return jsonify({"id": cur.lastrowid})


@app.route("/api/cats/<int:cat_id>", methods=["PUT"])
def update_cat(cat_id):
    data = request.json
    with get_db() as conn:
        conn.execute(
            "UPDATE cats SET name=?, breed=?, birthdate=?, photo_emoji=? WHERE id=?",
            (data["name"], data.get("breed", ""), data.get("birthdate", ""), data.get("photo_emoji", "🐱"), cat_id)
        )
    return jsonify({"ok": True})


@app.route("/api/cats/<int:cat_id>", methods=["DELETE"])
def delete_cat(cat_id):
    with get_db() as conn:
        conn.execute("DELETE FROM cats WHERE id=?", (cat_id,))
    return jsonify({"ok": True})


# ── Records ───────────────────────────────────────────────────────────────────

@app.route("/api/cats/<int:cat_id>/records", methods=["GET"])
def get_records(cat_id):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM records WHERE cat_id=? ORDER BY done_date DESC",
            (cat_id,)
        ).fetchall()
        today = date.today().isoformat()
        result = []
        for r in rows:
            d = dict(r)
            if d["next_date"]:
                if d["next_date"] < today:
                    d["status"] = "overdue"
                elif d["next_date"] <= (date.today() + timedelta(days=30)).isoformat():
                    d["status"] = "upcoming"
                else:
                    d["status"] = "ok"
            else:
                d["status"] = "done"
            result.append(d)
        return jsonify(result)


@app.route("/api/records", methods=["POST"])
def add_record():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO records (cat_id, type, name, done_date, next_date, notes) VALUES (?, ?, ?, ?, ?, ?)",
            (data["cat_id"], data["type"], data["name"],
             data["done_date"], data.get("next_date"), data.get("notes", ""))
        )
        return jsonify({"id": cur.lastrowid})


@app.route("/api/records/<int:record_id>", methods=["PUT"])
def update_record(record_id):
    data = request.json
    with get_db() as conn:
        conn.execute(
            "UPDATE records SET type=?, name=?, done_date=?, next_date=?, notes=? WHERE id=?",
            (data["type"], data["name"], data["done_date"],
             data.get("next_date"), data.get("notes", ""), record_id)
        )
    return jsonify({"ok": True})


@app.route("/api/records/<int:record_id>", methods=["DELETE"])
def delete_record(record_id):
    with get_db() as conn:
        conn.execute("DELETE FROM records WHERE id=?", (record_id,))
    return jsonify({"ok": True})


# ── Dashboard reminders ───────────────────────────────────────────────────────

@app.route("/api/reminders", methods=["GET"])
def get_reminders():
    today = date.today().isoformat()
    soon = (date.today() + timedelta(days=30)).isoformat()
    with get_db() as conn:
        rows = conn.execute("""
            SELECT r.*, c.name AS cat_name, c.photo_emoji
            FROM records r
            JOIN cats c ON c.id = r.cat_id
            WHERE r.next_date IS NOT NULL AND r.next_date <= ?
            ORDER BY r.next_date ASC
        """, (soon,)).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["status"] = "overdue" if d["next_date"] < today else "upcoming"
            result.append(d)
        return jsonify(result)


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
