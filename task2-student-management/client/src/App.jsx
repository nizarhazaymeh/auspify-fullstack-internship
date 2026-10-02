import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import StudentList from './pages/StudentList.jsx';
import StudentDetails from './pages/StudentDetails.jsx';
import AddStudent from './pages/AddStudent.jsx';
import EditStudent from './pages/EditStudent.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StudentList />} />
        <Route path="students/new" element={<AddStudent />} />
        <Route path="students/:id" element={<StudentDetails />} />
        <Route path="students/:id/edit" element={<EditStudent />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
