import ListingForm from '@/components/listings/ListingForm'

export default function EditListingPage({ params }: { params: { id: string } }) {
  // Use the extracted ListingForm with the draftId pre-filled
  return <ListingForm draftIdFromProps={params.id} />
}
