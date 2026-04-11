import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Car, MapPin, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-[#34495E] flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-12 h-12 text-[#E67E22]" />
        </div>
        <h1 className="text-6xl font-bold text-[#34495E] mb-2" style={{ fontFamily: 'Montserrat' }} data-testid="404-heading">
          404
        </h1>
        <p className="text-xl font-semibold text-[#34495E] mb-2" style={{ fontFamily: 'Montserrat' }}>
          Spot Not Found
        </p>
        <p className="text-slate-500 mb-8">
          Looks like this parking spot doesn't exist. Let's get you back on the road.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold px-8 py-5 shadow-lg btn-active" data-testid="404-home-btn">
              <Car className="w-5 h-5 mr-2" />
              Back to Park-Pal
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
