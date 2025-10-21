"use client";

import { useState, useEffect } from "react";

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);

    if (!t) return;

    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => res.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!token) return;

    const updates = {
      display_name: e.target.display_name.value,
      skin_type: e.target.skin_type.value,
      preferences: e.target.preferences.value
        .split(",")
        .map((p: string) => p.trim())
        .filter(Boolean),
      allergies: e.target.allergies.value
        .split(",")
        .map((a: string) => a.trim())
        .filter(Boolean),
      trust_mode: e.target.trust_mode.value,
    };

    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, updates }),
    });

    const data = await res.json();
    alert(data.success ? "✅ Profile updated!" : `⚠️ ${data.error}`);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "600px", margin: "auto" }}>
      <h1>Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Display Name:<br />
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            style={{ width: "100%" }}
          />
        </label>
        <br /><br />

        <label>
          Skin Type:<br />
          <select name="skin_type" defaultValue={profile?.skin_type ?? ""} style={{ width: "100%" }}>
            <option value="">Select your skin type</option>
            <option value="normal">Normal</option>
            <option value="dry">Dry</option>
            <option value="oily">Oily</option>
            <option value="combination">Combination</option>
            <option value="sensitive">Sensitive</option>
          </select>
        </label>
        <br /><br />

        <label>
          Preferences (comma separated):<br />
          <input
            name="preferences"
            defaultValue={(profile?.preferences ?? []).join(", ")}
            placeholder="e.g. vegan, cruelty-free"
            style={{ width: "100%" }}
          />
        </label>
        <br /><br />

        <label>
          Allergies (comma separated):<br />
          <input
            name="allergies"
            defaultValue={(profile?.allergies ?? []).join(", ")}
            placeholder="e.g. nuts, gluten"
            style={{ width: "100%" }}
          />
        </label>
        <br /><br />

        <label>
          Trust Mode:<br />
          <select name="trust_mode" defaultValue={profile?.trust_mode ?? "anonymous"} style={{ width: "100%" }}>
            <option value="anonymous">Anonymous</option>
            <option value="trusted">Trusted</option>
            <option value="verified">Verified</option>
          </select>
        </label>
        <br /><br />

        <button type="submit" style={{ marginTop: "1rem" }}>Save</button>

        {profile?.created_at && (
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "1rem" }}>
            Created at: {new Date(profile.created_at).toLocaleString()}
          </p>
        )}
      </form>
    </div>
  );
}