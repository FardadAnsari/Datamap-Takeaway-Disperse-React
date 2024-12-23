import React from "react";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineMoreTime } from "react-icons/md";
import { GoDash } from "react-icons/go";

const DayPeriods = ({ dayIndex }) => {
  const { control, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `hours.${dayIndex}.periods`,
  });

  const handleAddPeriod = () => {
    append({
      openTime: { hours: 0, minutes: 0 },
      closeTime: { hours: 0, minutes: 0 },
    });

    setValue(`hours.${dayIndex}.isClosed`, false);
  };

  const handleRemovePeriod = (periodIndex) => {
    remove(periodIndex);

    if (fields.length === 1) {
      setValue(`hours.${dayIndex}.isClosed`, true);
    }
  };

  return (
    <div>
      {fields.map((period, periodIndex) => (
        <div key={period.id} className="flex items-center gap-1 m-2">
          <Controller
            name={`hours.${dayIndex}.periods.${periodIndex}.openTime.hours`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                placeholder="HH"
                className="border px-1 py-1 rounded w-10 text-center"
                onFocus={() => {
                  if (field.value === 0) {
                    field.onChange("");
                  }
                }}
                onBlur={() => {
                  if (field.value === "") {
                    field.onChange(0);
                  }
                }}
                min="0"
                max="23"
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
              />
            )}
          />
          <span className="font-bold">:</span>
          <Controller
            name={`hours.${dayIndex}.periods.${periodIndex}.openTime.minutes`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                placeholder="MM"
                className="border px-1 py-1 rounded w-10 text-center"
                onFocus={() => {
                  if (field.value === 0) {
                    field.onChange("");
                  }
                }}
                onBlur={() => {
                  if (field.value === "") {
                    field.onChange(0);
                  }
                }}
                min="0"
                max="59"
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
              />
            )}
          />
          <span>
            <GoDash />
          </span>
          <Controller
            name={`hours.${dayIndex}.periods.${periodIndex}.closeTime.hours`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                placeholder="HH"
                className="border-2 px-1 py-1 rounded w-10 text-center"
                onFocus={() => {
                  if (field.value === 0) {
                    field.onChange("");
                  }
                }}
                onBlur={() => {
                  if (field.value === "") {
                    field.onChange(0);
                  }
                }}
                min="0"
                max="24"
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
              />
            )}
          />
          <span className="font-bold">:</span>
          <Controller
            name={`hours.${dayIndex}.periods.${periodIndex}.closeTime.minutes`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                {...field}
                placeholder="MM"
                className="border px-1 py-1 rounded w-10 text-center"
                onFocus={() => {
                  if (field.value === 0) {
                    field.onChange("");
                  }
                }}
                onBlur={() => {
                  if (field.value === "") {
                    field.onChange(0);
                  }
                }}
                min="0"
                max="59"
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
              />
            )}
          />
          <button
            type="button"
            onClick={() => handleRemovePeriod(periodIndex)}
            className="flex justify-center items-center w-8 h-8 bg-red-500 text-white rounded"
          >
            <FaRegTrashAlt size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddPeriod}
        className="flex bg-teal-500 px-1 py-1 rounded hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition ml-2"
      >
        <MdOutlineMoreTime size={25} color="white" />
      </button>
    </div>
  );
};

export default DayPeriods;
