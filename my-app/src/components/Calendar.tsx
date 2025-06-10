import React from "react";

const Calendar: React.FC = () => {
  return (
    <div className="col-md-8">
      <iframe
        src="https://calendar.google.com/calendar/embed?src=dwij.bhatt%40gmail.com&ctz=America%2FChicago"
        style={{ border: 0 }}
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="no"
      ></iframe>
    </div>
  );
};

export default Calendar;