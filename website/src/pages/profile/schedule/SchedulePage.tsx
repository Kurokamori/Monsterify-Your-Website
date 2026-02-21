import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { SchedulePage as SchedulePageComponent } from '../../../components/schedule';

const SchedulePage = () => {
  useDocumentTitle('Schedule');
  return <SchedulePageComponent />;
};

export default SchedulePage;
