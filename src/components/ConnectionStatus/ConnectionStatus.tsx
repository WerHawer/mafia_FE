import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { useSocket } from "../../hooks/useSocket";
import { MessagePriority } from "../../types/socket.types";
import styles from "./ConnectionStatus.module.scss";

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus = observer(
  ({ showDetails = false, className = "" }: ConnectionStatusProps) => {
    const { isConnected, queueSize, isProcessing, getQueueStats } = useSocket();
    const [lastConnectionTime, setLastConnectionTime] = useState<number>(
      Date.now()
    );

    useEffect(() => {
      if (isConnected) {
        setLastConnectionTime(Date.now());
      }
    }, [isConnected]);

    const getStatusColor = () => {
      if (!isConnected) return "error";
      if (queueSize > 0) return "warning";
      return "success";
    };

    const getStatusText = () => {
      if (!isConnected) return "Disconnected";
      if (isProcessing) return "Syncing...";
      if (queueSize > 0) return `Queue: ${queueSize}`;
      return "Connected";
    };

    const stats = getQueueStats();

    return (
      <div
        className={`${styles.connectionStatus} ${styles[getStatusColor()]} ${className}`}
      >
        <div className={styles.statusIndicator}>
          <div className={styles.dot} />
          <span className={styles.statusText}>{getStatusText()}</span>
        </div>

        {showDetails && (
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span>Connection: </span>
              <span className={styles[getStatusColor()]}>
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>

            {queueSize > 0 && (
              <>
                <div className={styles.detailItem}>
                  <span>Queue Total: </span>
                  <span>{stats.total}</span>
                </div>
                <div className={styles.detailItem}>
                  <span>High Priority: </span>
                  <span className={styles.high}>{stats.high}</span>
                </div>
                <div className={styles.detailItem}>
                  <span>Normal: </span>
                  <span>{stats.normal}</span>
                </div>
                <div className={styles.detailItem}>
                  <span>Low Priority: </span>
                  <span>{stats.low}</span>
                </div>
                {stats.failed > 0 && (
                  <div className={styles.detailItem}>
                    <span>Failed: </span>
                    <span className={styles.error}>{stats.failed}</span>
                  </div>
                )}
              </>
            )}

            {!isConnected && (
              <div className={styles.detailItem}>
                <span>Last Connected: </span>
                <span>{new Date(lastConnectionTime).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ConnectionStatus.displayName = "ConnectionStatus";
