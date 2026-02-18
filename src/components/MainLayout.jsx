import { Outlet } from 'react-router-dom';
import SiteFooter from './SiteFooter';

export default function MainLayout() {
  return (
    <>
      <Outlet />
      <SiteFooter />
    </>
  );
}
