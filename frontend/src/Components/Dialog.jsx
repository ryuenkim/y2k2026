import { useState } from 'react';
import { DialogContext } from './dialogContext';

export default function DialogProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const close = (value) => {
        dialog?.resolve(value);
        setDialog(null);
    };

    const confirm = (message, title = 'Please confirm') => new Promise((resolve) => {
        setDialog({ type: 'confirm', title, message, resolve });
    });

    const prompt = (message, defaultValue = '', title = 'Enter a value', options = null) => new Promise((resolve) => {
        setDialog({ type: 'prompt', title, message, defaultValue, options, resolve });
    });

    const notify = (message, type = 'success') => {
        const id = `${Date.now()}-${Math.random()}`;
        setNotifications((current) => [...current, { id, message, type }].slice(-4));
        window.setTimeout(() => {
            setNotifications((current) => current.filter((notification) => notification.id !== id));
        }, 3500);
    };

    return <DialogContext.Provider value={{ confirm, prompt, notify }}>
        {children}
        {dialog && <DialogWindow dialog={dialog} onClose={close} />}
        <div className="notification-stack" aria-live="polite" aria-relevant="additions">
            {notifications.map((notification) => (
                <div className={`notification notification-${notification.type}`} key={notification.id} role={notification.type === 'error' ? 'alert' : 'status'}>
                    <span>{notification.message}</span>
                    <button type="button" aria-label="Dismiss notification" onClick={() => setNotifications((current) => current.filter((item) => item.id !== notification.id))}>×</button>
                </div>
            ))}
        </div>
    </DialogContext.Provider>;
}

function DialogWindow({ dialog, onClose }) {
    const [value, setValue] = useState(dialog.defaultValue || '');
    const [error, setError] = useState('');
    const submitPrompt = () => {
        if (dialog.type !== 'prompt') {
            onClose(true);
            return;
        }
        if (!value.trim()) {
            setError('This field is required.');
            return;
        }
        if (dialog.options && !dialog.options.includes(value)) {
            setError('Choose a valid option.');
            return;
        }
        onClose(value.trim());
    };
    return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(dialog.type === 'prompt' ? null : false);
    }}>
        <section className="dialog-window" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <p className="eyebrow">{dialog.type === 'prompt' ? 'INPUT REQUIRED' : 'CONFIRM ACTION'}</p>
            <h2 id="dialog-title">{dialog.title}</h2>
            <p className="dialog-message">{dialog.message}</p>
            {dialog.type === 'prompt' && (dialog.options ? <select autoFocus required value={value} aria-label={dialog.title} aria-invalid={Boolean(error)} onChange={(event) => {
                setValue(event.target.value);
                setError('');
            }} onKeyDown={(event) => {
                if (event.key === 'Enter') submitPrompt();
                if (event.key === 'Escape') onClose(null);
            }}>{dialog.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input autoFocus required value={value} aria-label={dialog.title} aria-invalid={Boolean(error)} onChange={(event) => {
                setValue(event.target.value);
                setError('');
            }} onKeyDown={(event) => {
                if (event.key === 'Enter') submitPrompt();
                if (event.key === 'Escape') onClose(null);
            }} />)}
            {error && <small className="field-error" role="alert">{error}</small>}
            <div className="dialog-actions">
                <button type="button" className="dialog-cancel" onClick={() => onClose(dialog.type === 'prompt' ? null : false)}>Cancel</button>
                <button type="button" className="dialog-confirm" onClick={submitPrompt}>
                    {dialog.type === 'prompt' ? 'Save' : 'Continue'}
                </button>
            </div>
        </section>
    </div>;
}
