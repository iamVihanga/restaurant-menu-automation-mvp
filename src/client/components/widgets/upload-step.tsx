import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";

import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@client/components/ui/dropzone";
import { CloudUploadIcon, Trash2Icon } from "lucide-react";
import { setStep, setMenuImage } from "@client/lib/stores/toolStore";

type Props = {};

export function UploadStep({}: Props) {
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      setStep("process");
      setMenuImage(file);

      return {
        status: "success",
        result: URL.createObjectURL(file),
      };
    },
    validation: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg"],
      },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
    },
  });

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Upload Restaurant Menu</CardTitle>
        <CardDescription>
          Upload a restaurant menu file to get started.
        </CardDescription>
      </CardHeader>

      <CardContent className="">
        <div className="not-prose flex flex-col gap-4">
          <Dropzone {...dropzone}>
            <div>
              <DropZoneArea className="w-full">
                <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                  <CloudUploadIcon className="size-8" />
                  <div>
                    <p className="font-semibold">Upload listing images</p>
                    <p className="text-muted-foreground text-sm">
                      Click here or drag and drop to upload
                    </p>
                  </div>
                </DropzoneTrigger>
              </DropZoneArea>

              <div className="mt-2 flex justify-between">
                <DropzoneDescription>
                  {`Please select a file to upload. Supported formats: PNG, JPG up to 10MB.`}
                </DropzoneDescription>
                <DropzoneMessage />
              </div>
            </div>

            <DropzoneFileList className="grid grid-cols-3 gap-3 p-0">
              {dropzone.fileStatuses.map((file) => (
                <DropzoneFileListItem
                  className="bg-secondary overflow-hidden rounded-md p-0 shadow-sm"
                  key={file.id}
                  file={file}
                >
                  {file.status === "pending" && (
                    <div className="aspect-video animate-pulse bg-black/20" />
                  )}
                  {file.status === "success" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.result}
                      alt={`uploaded-${file.fileName}`}
                      className="aspect-video object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between p-2 pl-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{file.fileName}</p>
                      <p className="text-muted-foreground text-xs">
                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <DropzoneRemoveFile className="shrink-0 hover:outline">
                      <Trash2Icon className="size-4" />
                    </DropzoneRemoveFile>
                  </div>
                </DropzoneFileListItem>
              ))}
            </DropzoneFileList>
          </Dropzone>
        </div>
      </CardContent>
    </Card>
  );
}
