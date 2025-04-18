import CountUp from "react-countup";
import { PiPhoneCallLight } from "react-icons/pi";
import { PiCursorClickLight } from "react-icons/pi";
import { TbSum } from "react-icons/tb";

const TotalInteractions = ({ webCallCount }) => {
  return (
    <>
      <p className="text-xl font-medium caption-top p-2">Total Interactions</p>
      <div className="flex flex-col gap-3 mx-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <PiPhoneCallLight size={22} />
            <p className="text-lg">Total Call Clicks</p>
          </div>

          <div className="flex justify-center py-2 text-2xl font-medium">
            <CountUp
              start={0}
              end={webCallCount.total_call_clicks}
              duration={5}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <PiCursorClickLight size={22} />
            <p className="text-lg">Total Website Clicks</p>
          </div>
          <div className="flex justify-center py-2 text-2xl font-medium">
            <CountUp
              start={0}
              end={webCallCount.total_website_clicks}
              duration={5}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <TbSum size={22} />
            <p className="text-lg">Total All</p>
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
    </>
  );
};

export default TotalInteractions;
