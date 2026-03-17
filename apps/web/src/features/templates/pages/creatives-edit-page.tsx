import { useParams } from 'react-router'
import Creatives from './creatives-selector'

export default function CreativesEditPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="mt-0">
      <Creatives editId={id} />
    </div>
  )
}
