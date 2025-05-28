type Props = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

const Message = ({ text, sender }: Props) => (
  <div className={`message ${sender}`}>{text}</div>
);

export default Message;
