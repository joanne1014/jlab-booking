import TimeSlotPicker from './components/TimeSlotPicker';

// 喺你嘅 component 入面
const [selectedDate, setSelectedDate] = useState('');
const [selectedTime, setSelectedTime] = useState('');

// 當改日期時清空時間
const handleDateChange = (date) => {
  setSelectedDate(date);
  setSelectedTime('');
};

// JSX 入面放呢個
<TimeSlotPicker
  selectedDate={selectedDate}
  selectedTime={selectedTime}
  onSelectTime={setSelectedTime}
/>
