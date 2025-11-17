import { useStore } from './store';
import { UploadPage } from './components/UploadPage';
import { EditPage } from './components/EditPage';
import { ModelPage } from './components/ModelPage';

function App() {
  const currentPage = useStore((state) => state.currentPage);

  return (
    <>
      {currentPage === 'upload' && <UploadPage />}
      {currentPage === 'edit' && <EditPage />}
      {currentPage === 'model' && <ModelPage />}
    </>
  );
}

export default App;
