import React from "react";
import CountUp from "react-countup";

const TotalInteractions = ({ webCallCount }) => {
  return (
    <>
      <div className="flex justify-center py-2 border-b-2">
        <span className="text-xl font-medium caption-top">
          Total Interactions
        </span>
      </div>
      <div className="flex flex-col gap-3 pt-6">
        <div className="flex flex-col items-center justify-center">
          <span className="text-lg">Total Call Clicks</span>
          <div className="flex justify-center py-2 text-3xl font-bold text-teal-800">
            <CountUp
              start={0}
              end={webCallCount.total_call_clicks}
              duration={5}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-lg">Total Website Clicks</span>
          <div className="flex justify-center py-2 text-3xl font-bold text-teal-800">
            <CountUp
              start={0}
              end={webCallCount.total_website_clicks}
              duration={5}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-lg">Total All</span>
          <div className="flex justify-center py-2 text-3xl font-bold text-teal-800">
            <CountUp
              start={0}
              end={
                webCallCount.total_call_clicks +
                webCallCount.total_website_clicks
              }
              duration={5}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TotalInteractions;
