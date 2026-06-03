import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function BuddyReadJoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Невірне запрошення');
      return;
    }

    (async () => {
      const { data, error: joinError } = await supabase.rpc('join_buddy_read', { p_token: token });
      if (joinError) {
        setError(joinError.message);
        return;
      }
      navigate(`/buddy-reads/${data}`, { replace: true });
    })();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="center-page">
        <p className="form-error">{error}</p>
        <Link to="/buddy-reads">До buddy reads</Link>
      </div>
    );
  }

  return <div className="center-page">Приєднуємось до buddy read…</div>;
}
