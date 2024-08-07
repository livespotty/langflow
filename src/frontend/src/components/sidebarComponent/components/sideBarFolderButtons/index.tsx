import {
  usePatchFolders,
  usePostFolders,
  usePostUploadFolders,
} from "@/controllers/API/queries/folders";
import { useGetDownloadFolders } from "@/controllers/API/queries/folders/use-get-download-folders";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FolderType } from "../../../../pages/MainPage/entities";
import useAlertStore from "../../../../stores/alertStore";
import useFlowsManagerStore from "../../../../stores/flowsManagerStore";
import { useFolderStore } from "../../../../stores/foldersStore";
import { handleKeyDown } from "../../../../utils/reactflowUtils";
import { cn } from "../../../../utils/utils";
import IconComponent, {
  ForwardedIconComponent,
} from "../../../genericIconComponent";
import { Button, buttonVariants } from "../../../ui/button";
import { Input } from "../../../ui/input";
import useFileDrop from "../../hooks/use-on-file-drop";

type SideBarFoldersButtonsComponentProps = {
  pathname: string;
  handleChangeFolder?: (id: string) => void;
  handleDeleteFolder?: (item: FolderType) => void;
};
const SideBarFoldersButtonsComponent = ({
  pathname,
  handleChangeFolder,
  handleDeleteFolder,
}: SideBarFoldersButtonsComponentProps) => {
  const refInput = useRef<HTMLInputElement>(null);
  const setFolders = useFolderStore((state) => state.setFolders);
  const folders = useFolderStore((state) => state.folders);
  const [foldersNames, setFoldersNames] = useState({});
  const takeSnapshot = useFlowsManagerStore((state) => state.takeSnapshot);
  const [editFolders, setEditFolderName] = useState(
    folders.map((obj) => ({ name: obj.name, edit: false })),
  );
  const currentFolder = pathname.split("/");
  const urlWithoutPath = pathname.split("/").length < 4;
  const myCollectionId = useFolderStore((state) => state.myCollectionId);
  const folderIdDragging = useFolderStore((state) => state.folderIdDragging);
  const refreshFolders = useFolderStore((state) => state.refreshFolders);

  const checkPathName = (itemId: string) => {
    if (urlWithoutPath && itemId === myCollectionId) {
      return true;
    }
    return currentFolder.includes(itemId);
  };
  const location = useLocation();
  const folderId = location?.state?.folderId ?? myCollectionId;
  const getFolderById = useFolderStore((state) => state.getFolderById);
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const getFoldersApi = useFolderStore((state) => state.getFoldersApi);

  const handleFolderChange = () => {
    getFolderById(folderId);
  };

  const { dragOver, dragEnter, dragLeave, onDrop } = useFileDrop(
    folderId,
    handleFolderChange,
  );

  const { mutate } = usePostUploadFolders();

  const handleUploadFlowsToFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.click();

    input.onchange = (event: Event) => {
      if (
        (event.target as HTMLInputElement).files![0].type === "application/json"
      ) {
        const file = (event.target as HTMLInputElement).files![0];
        const formData = new FormData();
        formData.append("file", file);
        file.text().then(async (text) => {
          const data = JSON.parse(text);
          if (data.data?.nodes) {
            await useFlowsManagerStore.getState().addFlow(true, data);
            getFolderById(folderId);
          } else {
            mutate(
              { formData },
              {
                onSuccess: () => {
                  getFolderById(folderId);
                  setSuccessData({
                    title: "Uploaded successfully",
                  });
                },
                onError: (err) => {
                  console.log(err);
                  setErrorData({
                    title: `Error on upload`,
                    list: [err["response"]["data"]],
                  });
                },
              },
            );
          }
        });
      }
    };
  };

  const { mutate: mutateDownloadFolder } = useGetDownloadFolders();

  const handleDownloadFolder = (id: string) => {
    mutateDownloadFolder(
      {
        folderId: id,
      },
      {
        onSuccess: (data) => {
          const folder = folders.find((f) => f.id === data.folderId);

          data.folder_name = folder?.name || "folder";
          data.folder_description = folder?.description || "";

          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(data),
          )}`;

          const link = document.createElement("a");
          link.href = jsonString;
          link.download = `${data.folder_name}.json`;

          link.click();
        },
        onError: () => {
          setErrorData({
            title: `An error occurred while downloading folder.`,
          });
        },
      },
    );
  };

  const { mutate: mutateAddFolder } = usePostFolders();
  const { mutate: mutateUpdateFolder } = usePatchFolders();

  function addNewFolder() {
    mutateAddFolder(
      {
        data: {
          name: "New Folder",
          parent_id: null,
          description: "",
        },
      },
      {
        onSuccess: () => {
          refreshFolders();
        },
      },
    );
  }

  function handleEditFolderName(e, name): void {
    const {
      target: { value },
    } = e;
    setFoldersNames((old) => ({
      ...old,
      [name]: value,
    }));
  }

  useEffect(() => {
    folders.map((obj) => ({ name: obj.name, edit: false }));
  }, [folders]);

  const handleEditNameFolder = async (item) => {
    const newEditFolders = editFolders.map((obj) => {
      if (obj.name === item.name) {
        return { name: item.name, edit: false };
      }
      return { name: obj.name, edit: false };
    });
    setEditFolderName(newEditFolders);
    if (foldersNames[item.name].trim() !== "") {
      setFoldersNames((old) => ({
        ...old,
        [item.name]: foldersNames[item.name],
      }));
      const body = {
        ...item,
        name: foldersNames[item.name],
        flows: item.flows?.length > 0 ? item.flows : [],
        components: item.components?.length > 0 ? item.components : [],
      };

      mutateUpdateFolder(
        {
          data: body,
          folderId: item.id!,
        },
        {
          onSuccess: (updatedFolder) => {
            const updatedFolderIndex = folders.findIndex(
              (f) => f.id === updatedFolder.id,
            );

            const updateFolders = [...folders];
            updateFolders[updatedFolderIndex] = updatedFolder;

            setFolders(updateFolders);
            setFoldersNames({});
            setEditFolderName(
              folders.map((obj) => ({
                name: obj.name,
                edit: false,
              })),
            );
          },
        },
      );
    } else {
      setFoldersNames((old) => ({
        ...old,
        [item.name]: item.name,
      }));
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex-1 self-start text-lg font-semibold">Folders</div>
        <Button
          variant="primary"
          size="icon"
          className="px-2"
          onClick={addNewFolder}
          data-testid="add-folder-button"
        >
          <ForwardedIconComponent name="FolderPlus" className="w-4" />
        </Button>
        <Button
          variant="primary"
          size="icon"
          className="px-2"
          onClick={handleUploadFlowsToFolder}
          data-testid="upload-folder-button"
        >
          <ForwardedIconComponent name="Upload" className="w-4" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-auto lg:h-[70vh] lg:flex-col">
        <>
          {folders.map((item, index) => {
            const editFolderName = editFolders?.filter(
              (folder) => folder.name === item.name,
            )[0];
            return (
              <div
                onDragOver={(e) => dragOver(e, item.id!)}
                onDragEnter={(e) => dragEnter(e, item.id!)}
                onDragLeave={dragLeave}
                onDrop={(e) => onDrop(e, item.id!)}
                key={item.id}
                data-testid={`sidebar-nav-${item.name}`}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  checkPathName(item.id!)
                    ? "border border-border bg-muted hover:bg-muted"
                    : "border hover:bg-transparent lg:border-transparent lg:hover:border-border",
                  "group flex w-full shrink-0 cursor-pointer gap-2 opacity-100 lg:min-w-full",
                  folderIdDragging === item.id! ? "bg-border" : "",
                )}
                onClick={() => handleChangeFolder!(item.id!)}
              >
                <div
                  onDoubleClick={(event) => {
                    if (item.name === "My Projects") {
                      return;
                    }

                    if (!foldersNames[item.name]) {
                      setFoldersNames({ [item.name]: item.name });
                    }

                    if (
                      editFolders.find((obj) => obj.name === item.name)?.name
                    ) {
                      const newEditFolders = editFolders.map((obj) => {
                        if (obj.name === item.name) {
                          return { name: item.name, edit: true };
                        }
                        return { name: obj.name, edit: false };
                      });
                      setEditFolderName(newEditFolders);
                      takeSnapshot();
                      event.stopPropagation();
                      event.preventDefault();
                      return;
                    }

                    setEditFolderName((old) => [
                      ...old,
                      { name: item.name, edit: true },
                    ]);
                    setFoldersNames((oldFolder) => ({
                      ...oldFolder,
                      [item.name]: item.name,
                    }));
                    takeSnapshot();
                    event.stopPropagation();
                    event.preventDefault();
                  }}
                  className="flex w-full items-center gap-2"
                >
                  <IconComponent
                    name={"folder"}
                    className="mr-2 w-4 flex-shrink-0 justify-start stroke-[1.5] opacity-100"
                  />
                  {editFolderName?.edit ? (
                    <div>
                      <Input
                        className="w-36"
                        onChange={(e) => {
                          handleEditFolderName(e, item.name);
                        }}
                        ref={refInput}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            const newEditFolders = editFolders.map((obj) => {
                              if (obj.name === item.name) {
                                return { name: item.name, edit: false };
                              }
                              return { name: obj.name, edit: false };
                            });
                            setEditFolderName(newEditFolders);
                            setFoldersNames({});
                            setEditFolderName(
                              folders.map((obj) => ({
                                name: obj.name,
                                edit: false,
                              })),
                            );
                          }
                          if (e.key === "Enter") {
                            refInput.current?.blur();
                          }
                          handleKeyDown(e, e.key, "");
                        }}
                        autoFocus={true}
                        onBlur={async () => {
                          if (refInput.current?.value !== item.name) {
                            handleEditNameFolder(item);
                          } else {
                            editFolderName.edit = false;
                          }
                        }}
                        value={foldersNames[item.name]}
                        id={`input-folder-${item.name}`}
                        data-testid={`input-folder`}
                      />
                    </div>
                  ) : (
                    <span className="block w-full truncate opacity-100">
                      {item.name}
                    </span>
                  )}
                  {index > 0 && (
                    <Button
                      data-testid="btn-delete-folder"
                      className="hidden p-0 hover:bg-white group-hover:block hover:dark:bg-[#0c101a00]"
                      onClick={(e) => {
                        handleDeleteFolder!(item);
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      variant={"ghost"}
                      size={"icon"}
                    >
                      <IconComponent
                        name={"trash"}
                        className="w-4 stroke-[1.5] p-0"
                      />
                    </Button>
                  )}
                  <Button
                    className="hidden p-0 hover:bg-white group-hover:block hover:dark:bg-[#0c101a00]"
                    onClick={(e) => {
                      handleDownloadFolder(item.id!);
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    unstyled
                  >
                    <IconComponent
                      name={"Download"}
                      className="w-4 stroke-[1.5] text-white"
                    />
                  </Button>
                </div>
              </div>
            );
          })}
        </>
      </div>
    </>
  );
};
export default SideBarFoldersButtonsComponent;
