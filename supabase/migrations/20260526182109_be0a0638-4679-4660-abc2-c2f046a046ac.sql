
DROP POLICY IF EXISTS "Landlords upload to own hostel folder" ON storage.objects;
DROP POLICY IF EXISTS "Landlords update own hostel images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords delete own hostel images" ON storage.objects;

CREATE POLICY "Landlords upload to own hostel folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hostel-images'
  AND EXISTS (
    SELECT 1 FROM public.hostels h
    WHERE h.id::text = (storage.foldername(storage.objects.name))[1]
      AND h.owner_id = auth.uid()
  )
);

CREATE POLICY "Landlords update own hostel images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'hostel-images'
  AND EXISTS (
    SELECT 1 FROM public.hostels h
    WHERE h.id::text = (storage.foldername(storage.objects.name))[1]
      AND h.owner_id = auth.uid()
  )
);

CREATE POLICY "Landlords delete own hostel images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'hostel-images'
  AND EXISTS (
    SELECT 1 FROM public.hostels h
    WHERE h.id::text = (storage.foldername(storage.objects.name))[1]
      AND h.owner_id = auth.uid()
  )
);
