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
      preferences: e.target.preferences.value.split(",").map((p: string) => p.trim()),
    };
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, updates }),
    });
    const data = await res.json();
    alert(data.success ? "Profile updated!" : data.error);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Display Name:
          <input name="display_name" defaultValue={profile?.display_name ?? ""} />
        </label>
        <br />
        <label>
          Skin Type:
          <input name="skin_type" defaultValue={profile?.skin_type ?? ""} />
        </label>
        <br />
        <label>
          Preferences (comma separated):
          <input name="preferences" defaultValue={(profile?.preferences ?? []).join(", ")} />
        </label>
        <br />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}