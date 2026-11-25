import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

export const useMatchSignalR = (
  competitionLevelID: string,
  onMatchUpdate: () => void,
) => {
  const callbackRef = useRef(onMatchUpdate);

  useEffect(() => {
    callbackRef.current = onMatchUpdate;
  }, [onMatchUpdate]);

  useEffect(() => {
    if (!competitionLevelID) return;

    const baseUrl = (
      import.meta.env.VITE_API_BASE_URLS || "/RovMN"
    ).replace(/\/+$/, "");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/matchHub`, {
        // ทดสอบโดยไม่ใช้ WebSocket
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    let disposed = false;

    const joinGroup = async () => {
      await connection.invoke(
        "JoinTournamentGroup",
        competitionLevelID,
      );
    };

    const handleMatchUpdate = () => {
      callbackRef.current();
    };

    connection.on("ReceiveMatchUpdate", handleMatchUpdate);

    connection.onreconnected(async () => {
      try {
        await joinGroup();
        console.log("SignalR reconnected:", connection.connectionId);
      } catch (error) {
        console.error("SignalR rejoin group error:", error);
      }
    });

    connection.onreconnecting((error) => {
      console.warn("SignalR reconnecting:", error);
    });

    connection.onclose((error) => {
      if (!disposed) {
        console.error("SignalR closed:", error);
      }
    });

    const startConnection = async () => {
      try {
        await connection.start();

        if (disposed) {
          await connection.stop();
          return;
        }

        await joinGroup();

        console.log(
          "SignalR Long Polling connected:",
          connection.connectionId,
        );
      } catch (error) {
        if (!disposed) {
          console.error("SignalR start error:", error);
        }
      }
    };

    void startConnection();

    return () => {
      disposed = true;
      connection.off("ReceiveMatchUpdate", handleMatchUpdate);
      void connection.stop();
    };
  }, [competitionLevelID]);
};