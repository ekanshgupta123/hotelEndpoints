"use client";
import Navbar from '@/components/Navbar';


const Home = () => {
  return (
    <div style={{ display: 'flex' }}>
      <header>
        <Navbar />
      </header>
      <div style={{ marginTop: '20%', marginLeft: '25%', display: 'flex', flexDirection: 'column', width: '10%', scale: '1.2' }}>
        <label>New to Checkins?</label>
        <a style={{ padding: '2%', borderColor: 'navy', borderStyle: 'solid', borderWidth: '2px' }}
        href='/signup'>Signup!</a>
      </div>
      <div style={{ marginTop: '20%', marginLeft: '25%', display: 'flex', flexDirection: 'column', width: '10%', scale: '1.2' }}>
        <label>Already a User?</label>
        <a style={{ padding: '2%', borderColor: 'navy', borderStyle: 'solid', borderWidth: '2px' }}
        href='/login'>Login!</a>
      </div>
    </div>
  )
};

export default Home;
