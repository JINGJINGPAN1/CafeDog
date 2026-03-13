import { useParams, Link } from 'react-router-dom';

function CafeDetail() {
    // 🌟 Magic: get the dynamic ID from the browser URL
    const { id } = useParams();

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1>☕️ Café Detail</h1>
            <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px' }}>
                <h2>This is a dedicated page!</h2>
                <p>
                    The café you just clicked has the following real <code>_id</code> in the database:
                </p>
                <code style={{ backgroundColor: '#ccc', padding: '5px', borderRadius: '4px' }}>{id}</code>
            </div>

            <br />
            {/* A button that takes you back to the home page without reloading the whole page */}
            <Link to="/" style={{ textDecoration: 'none', color: 'blue', fontSize: '18px' }}>
                👈 Back to discovery page
            </Link>
        </div>
    );
}

export default CafeDetail;