import { Spinner } from "react-bootstrap";
import Message from "./Message";
import type {
  Message as MessageType,
  ReservaData,
  ReservaDataRoom,
} from "./types";
import React, { forwardRef } from "react";

type Props = {
  messages: MessageType[];
  step: string;
  setReservaData: React.Dispatch<React.SetStateAction<ReservaData>>;
  reservaData: ReservaData;
  reservaDataRoom: ReservaDataRoom;
  setStep: (step: string) => void;
};

const ChatWindow = forwardRef<HTMLDivElement, Props>(
  ({ messages, step }, ref) => {
    return (
      <div className="chat-messages">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}
        <div ref={ref}></div>
      </div>
    );
  }
);

export default ChatWindow;
