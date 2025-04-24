// import type { ReactNode } from 'react';
// import { Navigate, useLocation } from 'react-router-dom';

// interface PrivateRouteProps {
//   children: ReactNode;
// }

// const PrivateRoute = ({ children }: PrivateRouteProps) => {
//   const location = useLocation();
//   const token = localStorage.getItem('token');

//   if (!token) {
//     return <Navigate to="/login" state={{ from: location }} />;
//   }

//   return <>{children}</>;
// };

// export default PrivateRoute;
