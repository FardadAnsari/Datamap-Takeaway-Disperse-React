import CountUp from "react-countup";
import { PiPhoneCallLight } from "react-icons/pi";
import { PiCursorClickLight } from "react-icons/pi";
import { TbSum } from "react-icons/tb";

const TotalInteractions = ({ webCallCount }) => {
  return (
    <div className="w-full flex flex-col gap-3 p-4">
      <p className="text-lg font-medium">Total Interactions</p>
      <div className="w-full flex justfiy-between gap-3">
        <div className="w-1/3 flex flex-col items-center justify-between">
          <div className="flex gap-1 items-center">
            <PiPhoneCallLight size={22} />
            <p className="text-md">Call Clicks</p>
          </div>
          <div className="flex justify-center py-2 text-2xl font-medium">
            <CountUp
              start={0}
              end={webCallCount.total_call_clicks}
              duration={5}
            />
          </div>
        </div>
        <div className="w-1/3 flex flex-col items-center justify-between">
          <div className="flex gap-1 items-center">
            <PiCursorClickLight size={22} />
            <p className="text-md">Website Clicks</p>
          </div>
          <div className="flex justify-center py-2 text-2xl font-medium">
            <CountUp
              start={0}
              end={webCallCount.total_website_clicks}
              duration={5}
            />
          </div>
        </div>
        <div className="w-1/3 flex flex-col items-center justify-between">
          <div className="flex gap-1 items-center">
            <TbSum size={22} />
            <p className="text-md">Total All</p>
          </div>

          <div className="flex justify-center py-2 text-2xl font-medium">
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
    </div>
  );
};

export default TotalInteractions;
