import {useContext } from 'react';
import AuthContext from './context';    

const useAuthContext = () => {
    if (!AuthContext) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
  return useContext(AuthContext);
};

export default useAuthContext;