import React from 'react';

const DetailModal = ({ item, labels, onClose, onEdit, onDelete, formatValue, getStatusClass }) => {
  const displayFields = Object.keys(labels);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Details</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            {displayFields.map((key) => {
              if (item[key] === undefined) return null;
              const val = item[key];
              return (
                <div key={key} className="detail-item">
                  <label>{labels[key] || key}</label>
                  <div className="detail-value">
                    {['status', 'severity', 'risk_level', 'priority', 'response_status', 'completion_status', 'sleep_quality'].includes(key) ? (
                      <span className={`status-badge ${getStatusClass(val)}`}>
                        {formatValue(key, val)}
                      </span>
                    ) : (
                      <span>{formatValue(key, val)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-edit" onClick={onEdit}>Edit</button>
          <button className="btn-delete" onClick={onDelete}>Delete</button>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
