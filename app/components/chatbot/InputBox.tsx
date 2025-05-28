type Props = {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
};

const InputBox = ({ inputMessage, setInputMessage, onSend }: Props) => (
  <div className="chat-input">
    <input
      type="text"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSend()}
    />
    <button onClick={onSend}>Enviar</button>
  </div>
);

export default InputBox;
