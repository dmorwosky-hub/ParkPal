import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Car, MapPin } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const NotFoundPage = () => (
  <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
      <div className="w-24 h-24 rounded-none bg-[#1a1a1a] border border-white/10 flex items-center justify-center mx-auto mb-6">
        <MapPin size={48} weight="light" className="text-[#DFFF00]" />
      </div>
      <h1 className="font-heading text-6xl font-black text-white mb-2 tracking-tight" data-testid="404-heading">404</h1>
      <p className="font-heading text-xl font-bold text-white mb-2">Spot Not Found</p>
      <p className="text-slate-500 mb-8">This parking spot doesn't exist. Let's get you back on the road.</p>
      <Link to="/"><Button className="bg-[#DFFF00] hover:bg-[#E8FF33] text-[#121212] rounded-none font-semibold px-8 py-5  btn-active" data-testid="404-home-btn"><Car size={20} weight="bold" className="mr-2" /> Back to Park-Pal</Button></Link>
    </motion.div>
  </div>
);

export default NotFoundPage;
