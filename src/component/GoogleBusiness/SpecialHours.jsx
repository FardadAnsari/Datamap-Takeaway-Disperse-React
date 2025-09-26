import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaRegTrashAlt } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import instance from "../../api/api";

// ---------- helpers ----------
const pad2 = (n) => String(n).padStart(2, "0");
const fmtDatePretty = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const byDateAsc = (a, b) => a.date.localeCompare(b.date);
const toTime = (h, m) => `${pad2(+h)}:${pad2(+m)}`;
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const startWeekday = (y, m) => new Date(y, m, 1).getDay(); // 0=Sun
const toISOFromDateObj = (d) => `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
const toDateObjFromISO = (iso) => {
  const [y, m, d] = iso.split("-").map((x) => +x);
  return { year: y, month: m, day: d };
};
const fmtTimeFromObj = (t) => {
  if (!t) return "";
  const h = Number.isFinite(+t.hours) ? +t.hours : 0;
  const m = Number.isFinite(+t.minutes) ? +t.minutes : 0;
  return toTime(h, m);
};
// ensure numbers (no leading zeros) in outgoing payload
const toInt = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ---------- NEW: Skeleton line (same style you used elsewhere) ----------
const SkeletonLine = ({ className = "" }) => (
  <div
    className={`w-full h-4 rounded bg-gray-200/80 animate-pulse ${className}`}
  />
);

// ---------- normalize GET -> entries ----------
function normalizeFromApi(data) {
  const periods = data?.specialHours?.specialHourPeriods ?? [];
  return periods
    .map((p, i) => {
      const date = p.startDate ? toISOFromDateObj(p.startDate) : null;
      if (!date) return null;
      const closed = !!p.closed;
      const opens = closed ? "" : fmtTimeFromObj(p.openTime);
      const closes = closed ? "" : fmtTimeFromObj(p.closeTime);
      return {
        id: `row-${i}`,
        date,
        closed,
        opens,
        closes,
      };
    })
    .filter(Boolean)
    .sort(byDateAsc);
}

// ---------- small calendar ----------
function MiniCalendar({ value, onChange, markedDates = [] }) {
  const base = value ? new Date(value + "T00:00:00") : new Date();
  const [y, setY] = useState(base.getFullYear());
  const [m, setM] = useState(base.getMonth());

  useEffect(() => {
    if (!value) return;
    const d = new Date(value + "T00:00:00");
    setY(d.getFullYear());
    setM(d.getMonth());
  }, [value]);

  const go = (delta) => {
    const d = new Date(y, m + delta, 1);
    setY(d.getFullYear());
    setM(d.getMonth());
  };

  const days = daysInMonth(y, m);
  const offset = startWeekday(y, m);
  const grid = Array.from({ length: offset }, () => null).concat(
    Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))
  );

  const isMarked = (d) => {
    const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    return markedDates.includes(iso);
  };

  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => go(-1)}
        >
          <FaChevronLeft />
        </button>

        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1"
            value={m}
            onChange={(e) => setM(+e.target.value)}
          >
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((nm, i) => (
              <option key={nm} value={i}>
                {nm}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={y}
            onChange={(e) => setY(+e.target.value)}
          >
            {Array.from({ length: 11 }, (_, i) => y - 5 + i).map((yy) => (
              <option key={yy} value={yy}>
                {yy}
              </option>
            ))}
          </select>
        </div>

        <button className="p-2 rounded hover:bg-gray-100" onClick={() => go(1)}>
          <FaChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 px-1 mb-1">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, idx) =>
          d ? (
            <button
              key={idx}
              onClick={() =>
                onChange(
                  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
                )
              }
              className={`py-2 text-sm rounded border ${
                value ===
                `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
                  ? "bg-orange-100 border-orange-500"
                  : "bg-white hover:bg-gray-50"
              }`}
              title={fmtDatePretty(
                `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
              )}
            >
              <div className="relative">
                {d.getDate()}
                {isMarked(d) && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
              </div>
            </button>
          ) : (
            <div key={idx} />
          )
        )}
      </div>
    </div>
  );
}

// ---------- main component ----------
export default function SpecialHours({ locationId }) {
  const accessToken = sessionStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // list of entries you will save
  const [entries, setEntries] = useState([]); // [{id?, date, closed, opens, closes}]
  const markedDates = useMemo(() => entries.map((e) => e.date), [entries]);

  // form
  const [date, setDate] = useState("");
  const [closed, setClosed] = useState(false);
  const [openHour, setOpenHour] = useState("");
  const [openMin, setOpenMin] = useState("");
  const [closeHour, setCloseHour] = useState("");
  const [closeMin, setCloseMin] = useState("");

  const hours = Array.from({ length: 24 }, (_, h) => pad2(h));
  const mins = [
    "00",
    "05",
    "10",
    "15",
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
    "55",
  ];

  // load existing (specific to your API)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!locationId) return;
      setLoading(true);
      try {
        const { data } = await instance.get(
          `/api/v1/google/locations/${locationId}/special-hours`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const list = normalizeFromApi(data);
        if (alive) setEntries(list);
      } catch (e) {
        console.error(e);
        if (alive) setEntries([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [locationId, accessToken]);

  // when the user selects a date, autofill form if an entry exists
  useEffect(() => {
    if (!date) return;
    const ex = entries.find((e) => e.date === date);
    if (!ex) {
      setClosed(false);
      setOpenHour("");
      setOpenMin("");
      setCloseHour("");
      setCloseMin("");
      return;
    }
    setClosed(!!ex.closed);
    if (!ex.closed) {
      setOpenHour(ex.opens?.slice(0, 2) || "");
      setOpenMin(ex.opens?.slice[(3, 5)] || "");
      setCloseHour(ex.closes?.slice(0, 2) || "");
      setCloseMin(ex.closes?.slice(3, 5) || "");
    } else {
      setOpenHour("");
      setOpenMin("");
      setCloseHour("");
      setCloseMin("");
    }
  }, [date, entries]);

  // validation
  const timeError =
    !closed &&
    openHour &&
    openMin &&
    closeHour &&
    closeMin &&
    toTime(openHour, openMin) >= toTime(closeHour, closeMin)
      ? "Closing time must be after opening time."
      : "";

  const canAdd =
    !!date &&
    (closed || (openHour && openMin && closeHour && closeMin && !timeError));

  const resetForm = () => {
    setDate("");
    setClosed(false);
    setOpenHour("");
    setOpenMin("");
    setCloseHour("");
    setCloseMin("");
  };

  const addOrReplace = () => {
    if (!canAdd) return;
    const next = [...entries];
    const idx = next.findIndex((e) => e.date === date);
    const row = {
      id: idx !== -1 ? next[idx].id : `row-${Date.now()}`,
      date,
      closed,
      opens: closed ? "" : toTime(openHour, openMin),
      closes: closed ? "" : toTime(closeHour, closeMin),
    };
    if (idx !== -1) next[idx] = row;
    else next.push(row);
    next.sort(byDateAsc);
    setEntries(next);
    setDirty(true);
    resetForm();
  };

  const editRow = (r) => {
    setDate(r.date);
    setClosed(!!r.closed);
    if (!r.closed) {
      setOpenHour(r.opens?.slice(0, 2) || "");
      setOpenMin(r.opens?.slice(3, 5) || "");
      setCloseHour(r.closes?.slice(0, 2) || "");
      setCloseMin(r.closes?.slice(3, 5) || "");
    } else {
      setOpenHour("");
      setOpenMin("");
      setCloseHour("");
      setCloseMin("");
    }
  };

  const remove = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDirty(true);
  };

  // PATCH payload (numbers for hours/minutes)
  const saveAll = async () => {
    try {
      const specialHourPeriods = entries.map((e) => {
        const startDate = toDateObjFromISO(e.date);
        if (e.closed) {
          return { startDate, closed: true };
        }
        const [ohS, omS] = (e.opens || "0:0").split(":");
        const [chS, cmS] = (e.closes || "0:0").split(":");
        const oh = toInt(ohS, 0);
        const om = toInt(omS, 0);
        const ch = toInt(chS, 0);
        const cm = toInt(cmS, 0);

        return {
          startDate,
          endDate: { ...startDate }, // same-day window
          openTime: { hours: oh, minutes: om }, // integers
          closeTime: { hours: ch, minutes: cm }, // integers
        };
      });

      const payload = { specialHours: { specialHourPeriods } };

      await instance.patch(
        `/api/v1/google/locations/${locationId}/special-hours/`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDirty(false);
      alert("Special hours saved.");
    } catch (e) {
      console.error(e);
      alert("Failed to save special hours.");
    }
  };

  return (
    <div className="h-96 space-y-4 overflow-y-auto">
      {/* calendar + inputs */}
      <MiniCalendar value={date} onChange={setDate} markedDates={markedDates} />

      <div className="flex flex-col gap-3">
        {/* Opens at */}
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-gray-700">Opens at:</span>
          <select
            className="border rounded px-2 py-2 w-28"
            value={openHour}
            disabled={closed}
            onChange={(e) => setOpenHour(e.target.value)}
          >
            <option value="">Hour</option>
            {hours.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-2 w-28"
            value={openMin}
            disabled={closed}
            onChange={(e) => setOpenMin(e.target.value)}
          >
            <option value="">Min</option>
            {mins.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Closes at */}
        <div className="flex items-center gap-3">
          <span className="w-24 text-sm text-gray-700">Closes at:</span>
          <select
            className="border rounded px-2 py-2 w-28"
            value={closeHour}
            disabled={closed}
            onChange={(e) => setCloseHour(e.target.value)}
          >
            <option value="">Hour</option>
            {hours.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-2 w-28"
            value={closeMin}
            disabled={closed}
            onChange={(e) => setCloseMin(e.target.value)}
          >
            <option value="">Min</option>
            {mins.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={closed}
          onChange={(e) => setClosed(e.target.checked)}
        />
        Close the day
      </label>

      {timeError && <p className="text-xs text-rose-600">{timeError}</p>}

      <button
        onClick={addOrReplace}
        disabled={!canAdd}
        className={`w-full px-4 py-3 rounded ${
          canAdd
            ? "bg-orange-400 text-white hover:opacity-90"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        Add Hours
      </button>

      {/* list */}
      {loading ? (
        <div className="rounded h-60 overflow-y-auto divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-80 flex space-x-2 p-3">
              <SkeletonLine className="w-56" />
              <SkeletonLine className="w-24" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-gray-600">
          There are no special hours.
        </div>
      ) : (
        <div className="rounded h-60 overflow-y-auto">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between p-3 border-b last:border-b-0"
            >
              <div className="w-80 flex items-center justify-between">
                <div className="font-medium">{fmtDatePretty(e.date)}</div>
                <div className="text-sm text-gray-600">
                  {e.closed ? (
                    <span className="text-red-500">Closed</span>
                  ) : (
                    `${e.opens} – ${e.closes}`
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  onClick={() => editRow(e)}
                  title="Edit"
                >
                  <LuPencil />
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100 text-rose-600"
                  onClick={() => remove(e.id)}
                  title="Delete"
                >
                  <FaRegTrashAlt />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={saveAll}
          disabled={!dirty}
          className={`w-full px-4 py-3 rounded text-white ${
            dirty
              ? "bg-orange-400 hover:opacity-90"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
